import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import type { NovelConfig } from "../../config/schema";
import type { Diagnostic } from "../../shared/errors/diagnostics";
import { toRelativePosixPath } from "../../shared/fs/paths";
import { readTextFileSync } from "../../shared/fs/read";
import { writeTextFile } from "../../shared/fs/write";
import { createSha256Hex } from "../../shared/hashing/sha256";
import { parseFrontmatter } from "../../shared/markdown/frontmatter";
import type {
  ChapterEntity,
  CharacterEntity,
  FactionEntity,
  LocationEntity,
  NovelFileHash,
  NovelScanArgs,
  NovelScanMode,
  NovelScanResultJson,
  ScanCacheV1,
  ThreadEntity,
} from "./types";

function listMarkdownFiles(dir: string, options?: { sortLocale?: string }): string[] {
  if (!existsSync(dir)) return [];
  const stack: string[] = [dir];
  const files: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) continue;

    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(current, entry.name);
      if (entry.isDirectory()) {
        // Common convention: treat dot-dirs as private/metadata and skip them.
        if (entry.name.startsWith(".")) continue;
        stack.push(abs);
        continue;
      }

      if (!entry.isFile()) continue;
      const ext = extname(entry.name).toLowerCase();
      if (ext !== ".md") continue;
      files.push(abs);
    }
  }

  return files.sort((a, b) => a.localeCompare(b, options?.sortLocale));
}

function loadScanCache(cachePath: string): ScanCacheV1 | null {
  if (!existsSync(cachePath)) return null;
  try {
    const raw = readFileSync(cachePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    const maybe = parsed as Partial<ScanCacheV1>;
    if (maybe.version !== 1) return null;
    return maybe as ScanCacheV1;
  } catch {
    return null;
  }
}

function buildCachedMaps(cache: ScanCacheV1 | null): {
  fileByPath: Map<string, NovelFileHash>;
  chapterByPath: Map<string, ChapterEntity>;
  characterByPath: Map<string, CharacterEntity>;
  threadByPath: Map<string, ThreadEntity>;
  factionByPath: Map<string, FactionEntity>;
  locationByPath: Map<string, LocationEntity>;
  perFileDiagnostics: Map<string, Diagnostic[]>;
} {
  const fileByPath = new Map<string, NovelFileHash>();
  const chapterByPath = new Map<string, ChapterEntity>();
  const characterByPath = new Map<string, CharacterEntity>();
  const threadByPath = new Map<string, ThreadEntity>();
  const factionByPath = new Map<string, FactionEntity>();
  const locationByPath = new Map<string, LocationEntity>();
  const perFileDiagnostics = new Map<string, Diagnostic[]>();

  if (!cache) {
    return {
      fileByPath,
      chapterByPath,
      characterByPath,
      threadByPath,
      factionByPath,
      locationByPath,
      perFileDiagnostics,
    };
  }

  for (const file of cache.files ?? []) {
    fileByPath.set(file.path, file);
  }
  for (const entity of cache.entities?.chapters ?? []) {
    chapterByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.characters ?? []) {
    characterByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.threads ?? []) {
    threadByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.factions ?? []) {
    factionByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.locations ?? []) {
    locationByPath.set(entity.path, entity);
  }

  const cachedPerFile = cache.__internal?.perFileDiagnostics ?? {};
  for (const [path, list] of Object.entries(cachedPerFile)) {
    if (Array.isArray(list)) {
      perFileDiagnostics.set(path, list as Diagnostic[]);
    }
  }

  return {
    fileByPath,
    chapterByPath,
    characterByPath,
    threadByPath,
    factionByPath,
    locationByPath,
    perFileDiagnostics,
  };
}

function validateUniqueness(
  diagnostics: Diagnostic[],
  items: Array<{ id: string; path: string }>,
  code: string,
) {
  const seen = new Map<string, string>();
  for (const item of items) {
    const prev = seen.get(item.id);
    if (prev) {
      diagnostics.push({
        severity: "error",
        code,
        message: `ID 重复: ${item.id}`,
        evidence: [{ file: prev }, { file: item.path }],
        suggestedFix: "请重命名其中一个文件的 id，并重新运行 /novel-index。",
      });
    } else {
      seen.set(item.id, item.path);
    }
  }
}

function compileNamingPattern(options: {
  diagnostics: Diagnostic[];
  kind: string;
  pattern: string;
  strictMode: boolean;
}): RegExp | null {
  try {
    return new RegExp(options.pattern);
  } catch {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_NAMING_PATTERN_INVALID",
      message: `命名规则正则无效 (${options.kind}): ${options.pattern}`,
      suggestedFix: "请修复 .opencode/novel.jsonc 中 naming.*Pattern 的正则表达式。",
    });
    return null;
  }
}

function validateIdAgainstPattern(options: {
  diagnostics: Diagnostic[];
  kind: string;
  id: string;
  file: string;
  pattern: RegExp | null;
  patternSource: string;
  strictMode: boolean;
}) {
  if (!options.pattern) return;
  if (options.pattern.test(options.id)) return;
  options.diagnostics.push({
    severity: options.strictMode ? "error" : "warn",
    code: "SCAN_ID_PATTERN_MISMATCH",
    message: `${options.kind} id 不符合命名规则: ${options.id}`,
    file: options.file,
    suggestedFix: `请将 id 调整为匹配 ${options.patternSource}，或在 .opencode/novel.jsonc 中更新 naming.*Pattern。`,
  });
}

export function scanNovelProject(deps: {
  projectRoot: string;
  config: NovelConfig;
  args: NovelScanArgs;
}): { result: NovelScanResultJson; cacheToWrite?: ScanCacheV1 } {
  const startedAt = Date.now();
  const diagnostics: Diagnostic[] = [];

  const rootDir = resolve(deps.args.rootDir ?? deps.projectRoot);
  const manuscriptDirName = deps.args.manuscriptDir ?? deps.config.manuscriptDir;
  const manuscriptDir = resolve(join(rootDir, manuscriptDirName));

  const mode: NovelScanMode = deps.args.mode ?? "incremental";
  const strictMode = deps.args.strictMode ?? deps.config.continuity.strictMode ?? false;
  const writeCache = deps.args.writeCache ?? true;

  const cachePath = join(rootDir, deps.config.index.cacheDir, "scan.json");
  const previousCache = mode === "incremental" ? loadScanCache(cachePath) : null;
  const cachedMaps = buildCachedMaps(previousCache);

  const sortLocale = deps.config.index.stableSortLocale;

  const chapterIdPatternSource = deps.config.naming.chapterIdPattern;
  const characterIdPatternSource = deps.config.naming.characterIdPattern;
  const threadIdPatternSource = deps.config.naming.threadIdPattern;
  const factionIdPatternSource = deps.config.naming.factionIdPattern;
  const locationIdPatternSource = deps.config.naming.locationIdPattern;

  const chapterIdPattern = compileNamingPattern({
    diagnostics,
    kind: "chapter",
    pattern: chapterIdPatternSource,
    strictMode,
  });
  const characterIdPattern = compileNamingPattern({
    diagnostics,
    kind: "character",
    pattern: characterIdPatternSource,
    strictMode,
  });
  const threadIdPattern = compileNamingPattern({
    diagnostics,
    kind: "thread",
    pattern: threadIdPatternSource,
    strictMode,
  });
  const factionIdPattern = compileNamingPattern({
    diagnostics,
    kind: "faction",
    pattern: factionIdPatternSource,
    strictMode,
  });
  const locationIdPattern = compileNamingPattern({
    diagnostics,
    kind: "location",
    pattern: locationIdPatternSource,
    strictMode,
  });

  const expectedSubdirs = new Set([
    "chapters",
    "characters",
    "threads",
    "factions",
    "locations",
    "bible",
    "snapshots",
  ]);
  if (existsSync(manuscriptDir)) {
    const entries = readdirSync(manuscriptDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (expectedSubdirs.has(entry.name)) continue;
      diagnostics.push({
        severity: "info",
        code: "SCAN_UNKNOWN_DIR",
        message: `未知目录已忽略: ${entry.name}`,
        file: toRelativePosixPath(rootDir, join(manuscriptDir, entry.name)),
      });
    }
  }

  const chapterFiles = listMarkdownFiles(join(manuscriptDir, "chapters"), { sortLocale });
  const characterFiles = listMarkdownFiles(join(manuscriptDir, "characters"), { sortLocale });
  const threadFiles = listMarkdownFiles(join(manuscriptDir, "threads"), { sortLocale });
  const factionFiles = listMarkdownFiles(join(manuscriptDir, "factions"), { sortLocale });
  const locationFiles = listMarkdownFiles(join(manuscriptDir, "locations"), { sortLocale });

  const perFileDiagnostics = new Map<string, Diagnostic[]>();

  const files: NovelFileHash[] = [];
  const chapters: ChapterEntity[] = [];
  const characters: CharacterEntity[] = [];
  const threads: ThreadEntity[] = [];
  const factions: FactionEntity[] = [];
  const locations: LocationEntity[] = [];

  const allFiles = [
    ...chapterFiles.map((p) => ({ kind: "chapter" as const, path: p })),
    ...characterFiles.map((p) => ({ kind: "character" as const, path: p })),
    ...threadFiles.map((p) => ({ kind: "thread" as const, path: p })),
    ...factionFiles.map((p) => ({ kind: "faction" as const, path: p })),
    ...locationFiles.map((p) => ({ kind: "location" as const, path: p })),
  ].sort((a, b) => a.path.localeCompare(b.path, sortLocale));

  for (const file of allFiles) {
    const stats = statSync(file.path);
    const relPath = toRelativePosixPath(rootDir, file.path);

    const cachedHash = cachedMaps.fileByPath.get(relPath);
    const fastUnchanged =
      mode === "incremental" &&
      cachedHash &&
      cachedHash.size === stats.size &&
      cachedHash.mtimeMs === stats.mtimeMs;

    if (fastUnchanged) {
      files.push({
        path: relPath,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
        sha256: cachedHash.sha256,
      });

      const cachedDiags = cachedMaps.perFileDiagnostics.get(relPath) ?? [];
      perFileDiagnostics.set(relPath, cachedDiags);
      diagnostics.push(...cachedDiags);

      if (file.kind === "chapter") {
        const entity = cachedMaps.chapterByPath.get(relPath);
        if (entity) chapters.push(entity);
      } else if (file.kind === "character") {
        const entity = cachedMaps.characterByPath.get(relPath);
        if (entity) characters.push(entity);
      } else if (file.kind === "thread") {
        const entity = cachedMaps.threadByPath.get(relPath);
        if (entity) threads.push(entity);
      } else if (file.kind === "faction") {
        const entity = cachedMaps.factionByPath.get(relPath);
        if (entity) factions.push(entity);
      } else if (file.kind === "location") {
        const entity = cachedMaps.locationByPath.get(relPath);
        if (entity) locations.push(entity);
      }
      continue;
    }

    const content = readTextFileSync(file.path, { encoding: deps.config.encoding });
    const sha256 = createSha256Hex(content);

    files.push({
      path: relPath,
      mtimeMs: stats.mtimeMs,
      size: stats.size,
      sha256,
    });

    const hashUnchanged = mode === "incremental" && cachedHash?.sha256 === sha256;
    if (hashUnchanged) {
      const cachedDiags = cachedMaps.perFileDiagnostics.get(relPath) ?? [];
      perFileDiagnostics.set(relPath, cachedDiags);
      diagnostics.push(...cachedDiags);

      if (file.kind === "chapter") {
        const entity = cachedMaps.chapterByPath.get(relPath);
        if (entity) chapters.push(entity);
      } else if (file.kind === "character") {
        const entity = cachedMaps.characterByPath.get(relPath);
        if (entity) characters.push(entity);
      } else if (file.kind === "thread") {
        const entity = cachedMaps.threadByPath.get(relPath);
        if (entity) threads.push(entity);
      } else if (file.kind === "faction") {
        const entity = cachedMaps.factionByPath.get(relPath);
        if (entity) factions.push(entity);
      } else if (file.kind === "location") {
        const entity = cachedMaps.locationByPath.get(relPath);
        if (entity) locations.push(entity);
      }
      continue;
    }

    const parsed = parseFrontmatter<Record<string, unknown>>(content, {
      file: relPath,
      strict: strictMode,
    });
    perFileDiagnostics.set(relPath, parsed.diagnostics);
    diagnostics.push(...parsed.diagnostics);

    const data = parsed.data;

    if (file.kind === "chapter") {
      const chapterId = typeof data.chapter_id === "string" ? data.chapter_id : undefined;
      if (!chapterId) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_CHAPTER_ID_MISSING",
          message: "章节缺少必填字段 chapter_id。",
          file: relPath,
          suggestedFix: "在 frontmatter 中补充 chapter_id，例如 ch0001。",
        });
        continue;
      }

      validateIdAgainstPattern({
        diagnostics,
        kind: "chapter",
        id: chapterId,
        file: relPath,
        pattern: chapterIdPattern,
        patternSource: chapterIdPatternSource,
        strictMode,
      });

      const entity: ChapterEntity = {
        chapter_id: chapterId,
        title: typeof data.title === "string" ? data.title : undefined,
        path: relPath,
        pov: typeof data.pov === "string" ? data.pov : undefined,
        timeline: isPlainObject(data.timeline)
          ? {
              date: typeof data.timeline.date === "string" ? data.timeline.date : undefined,
              start: typeof data.timeline.start === "string" ? data.timeline.start : undefined,
              end: typeof data.timeline.end === "string" ? data.timeline.end : undefined,
              location:
                typeof data.timeline.location === "string" ? data.timeline.location : undefined,
            }
          : undefined,
        characters: Array.isArray(data.characters)
          ? (data.characters.filter((x) => typeof x === "string") as string[])
          : undefined,
        factions: Array.isArray(data.factions)
          ? (data.factions.filter((x) => typeof x === "string") as string[])
          : undefined,
        locations: Array.isArray(data.locations)
          ? (data.locations.filter((x) => typeof x === "string") as string[])
          : undefined,
        threads_opened: Array.isArray(data.threads_opened)
          ? (data.threads_opened.filter((x) => typeof x === "string") as string[])
          : undefined,
        threads_advanced: Array.isArray(data.threads_advanced)
          ? (data.threads_advanced.filter((x) => typeof x === "string") as string[])
          : undefined,
        threads_closed: Array.isArray(data.threads_closed)
          ? (data.threads_closed.filter((x) => typeof x === "string") as string[])
          : undefined,
        summary: typeof data.summary === "string" ? data.summary : undefined,
        tags: Array.isArray(data.tags)
          ? (data.tags.filter((x) => typeof x === "string") as string[])
          : undefined,
      };
      chapters.push(entity);
      continue;
    }

    if (file.kind === "character") {
      const id = typeof data.id === "string" ? data.id : undefined;
      if (!id) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_CHARACTER_ID_MISSING",
          message: "角色卡缺少必填字段 id。",
          file: relPath,
          suggestedFix: "在 frontmatter 中补充 id，例如 char-zhangsan。",
        });
        continue;
      }

      validateIdAgainstPattern({
        diagnostics,
        kind: "character",
        id,
        file: relPath,
        pattern: characterIdPattern,
        patternSource: characterIdPatternSource,
        strictMode,
      });

      const entity: CharacterEntity = {
        id,
        name: typeof data.name === "string" ? data.name : undefined,
        alias: Array.isArray(data.alias)
          ? (data.alias.filter((x) => typeof x === "string") as string[])
          : undefined,
        path: relPath,
      };
      characters.push(entity);
      continue;
    }

    if (file.kind === "thread") {
      const threadId = typeof data.thread_id === "string" ? data.thread_id : undefined;
      if (!threadId) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_THREAD_ID_MISSING",
          message: "线程卡缺少必填字段 thread_id。",
          file: relPath,
          suggestedFix: "在 frontmatter 中补充 thread_id，例如 th-001。",
        });
        continue;
      }

      validateIdAgainstPattern({
        diagnostics,
        kind: "thread",
        id: threadId,
        file: relPath,
        pattern: threadIdPattern,
        patternSource: threadIdPatternSource,
        strictMode,
      });

      const entity: ThreadEntity = {
        thread_id: threadId,
        type: typeof data.type === "string" ? data.type : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        path: relPath,
      };
      threads.push(entity);
      continue;
    }

    if (file.kind === "faction") {
      const id = typeof data.id === "string" ? data.id : undefined;
      if (!id) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_FACTION_ID_MISSING",
          message: "势力卡缺少必填字段 id。",
          file: relPath,
          suggestedFix: "在 frontmatter 中补充 id，例如 fac-blackhand。",
        });
        continue;
      }

      validateIdAgainstPattern({
        diagnostics,
        kind: "faction",
        id,
        file: relPath,
        pattern: factionIdPattern,
        patternSource: factionIdPatternSource,
        strictMode,
      });

      const entity: FactionEntity = {
        id,
        name: typeof data.name === "string" ? data.name : undefined,
        path: relPath,
      };
      factions.push(entity);
      continue;
    }

    if (file.kind === "location") {
      const id = typeof data.id === "string" ? data.id : undefined;
      if (!id) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_LOCATION_ID_MISSING",
          message: "地点卡缺少必填字段 id。",
          file: relPath,
          suggestedFix: "在 frontmatter 中补充 id，例如 loc-town。",
        });
        continue;
      }

      validateIdAgainstPattern({
        diagnostics,
        kind: "location",
        id,
        file: relPath,
        pattern: locationIdPattern,
        patternSource: locationIdPatternSource,
        strictMode,
      });

      const entity: LocationEntity = {
        id,
        name: typeof data.name === "string" ? data.name : undefined,
        path: relPath,
      };
      locations.push(entity);
    }
  }

  chapters.sort(
    (a, b) =>
      a.chapter_id.localeCompare(b.chapter_id, sortLocale) ||
      a.path.localeCompare(b.path, sortLocale),
  );
  characters.sort((a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale));
  threads.sort(
    (a, b) =>
      a.thread_id.localeCompare(b.thread_id, sortLocale) || a.path.localeCompare(b.path, sortLocale),
  );
  factions.sort((a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale));
  locations.sort((a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale));

  validateUniqueness(
    diagnostics,
    chapters.map((c) => ({ id: c.chapter_id, path: c.path })),
    "SCAN_DUP_CHAPTER_ID",
  );
  validateUniqueness(
    diagnostics,
    characters.map((c) => ({ id: c.id, path: c.path })),
    "SCAN_DUP_CHARACTER_ID",
  );
  validateUniqueness(
    diagnostics,
    threads.map((t) => ({ id: t.thread_id, path: t.path })),
    "SCAN_DUP_THREAD_ID",
  );
  validateUniqueness(
    diagnostics,
    factions.map((f) => ({ id: f.id, path: f.path })),
    "SCAN_DUP_FACTION_ID",
  );
  validateUniqueness(
    diagnostics,
    locations.map((l) => ({ id: l.id, path: l.path })),
    "SCAN_DUP_LOCATION_ID",
  );

  const definedCharacters = new Set(characters.map((c) => c.id));
  const definedThreads = new Set(threads.map((t) => t.thread_id));
  const definedFactions = new Set(factions.map((f) => f.id));
  const definedLocations = new Set(locations.map((l) => l.id));

  for (const chapter of chapters) {
    for (const charId of chapter.characters ?? []) {
      if (!definedCharacters.has(charId)) {
        diagnostics.push({
          severity: strictMode ? "error" : "warn",
          code: "SCAN_REF_CHARACTER_UNDEFINED",
          message: `章节引用了未定义角色: ${charId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/characters/${charId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    for (const factionId of chapter.factions ?? []) {
      if (!definedFactions.has(factionId)) {
        diagnostics.push({
          severity: strictMode ? "warn" : "info",
          code: "SCAN_REF_FACTION_UNDEFINED",
          message: `章节引用了未定义势力: ${factionId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/factions/${factionId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    for (const locationId of chapter.locations ?? []) {
      if (!definedLocations.has(locationId)) {
        diagnostics.push({
          severity: strictMode ? "warn" : "info",
          code: "SCAN_REF_LOCATION_UNDEFINED",
          message: `章节引用了未定义地点: ${locationId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/locations/${locationId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }
    for (const threadId of [
      ...(chapter.threads_opened ?? []),
      ...(chapter.threads_advanced ?? []),
      ...(chapter.threads_closed ?? []),
    ]) {
      if (!definedThreads.has(threadId)) {
        diagnostics.push({
          severity: strictMode ? "warn" : "info",
          code: "SCAN_REF_THREAD_UNDEFINED",
          message: `章节引用了未定义线程: ${threadId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/threads/${threadId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    const locationId = chapter.timeline?.location;
    if (locationId && !definedLocations.has(locationId)) {
      diagnostics.push({
        severity: strictMode ? "warn" : "info",
        code: "SCAN_REF_LOCATION_UNDEFINED",
        message: `章节引用了未定义地点(timeline.location): ${locationId}`,
        file: chapter.path,
        suggestedFix: `创建 manuscript/locations/${locationId}.md 或更新 timeline.location。`,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  const stats = {
    filesScanned: files.length,
    entities: {
      chapters: chapters.length,
      characters: characters.length,
      threads: threads.length,
      factions: factions.length,
      locations: locations.length,
    },
    durationMs,
  };

  const result: NovelScanResultJson = {
    version: 1,
    rootDir,
    manuscriptDir: manuscriptDirName,
    stats,
    files: files.sort((a, b) => a.path.localeCompare(b.path, sortLocale)),
    entities: { chapters, characters, threads, factions, locations },
    diagnostics,
    cache: { scanCachePath: writeCache ? toRelativePosixPath(rootDir, cachePath) : undefined },
  };

  const cacheToWrite: ScanCacheV1 | undefined = writeCache
    ? {
        ...result,
        __internal: {
          perFileDiagnostics: Object.fromEntries(perFileDiagnostics.entries()),
        },
      }
    : undefined;

  if (cacheToWrite) {
    writeTextFile(cachePath, `${JSON.stringify(cacheToWrite, null, 2)}\n`, {
      mode: "always",
    });
  }

  return { result, cacheToWrite };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function loadOrScan(deps: {
  projectRoot: string;
  config: NovelConfig;
  args?: Partial<NovelScanArgs>;
}): NovelScanResultJson {
  const args: NovelScanArgs = {
    rootDir: deps.args?.rootDir,
    manuscriptDir: deps.args?.manuscriptDir,
    mode: deps.args?.mode ?? "incremental",
    strictMode: deps.args?.strictMode,
    writeCache: deps.args?.writeCache ?? true,
  };

  return scanNovelProject({ projectRoot: deps.projectRoot, config: deps.config, args }).result;
}
