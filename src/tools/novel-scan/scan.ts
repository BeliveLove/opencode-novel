import { statSync } from "node:fs";
import { join, resolve } from "node:path";
import type { NovelConfig } from "../../config/schema";
import type { Diagnostic } from "../../shared/errors/diagnostics";
import { toRelativePosixPath } from "../../shared/fs/paths";
import { readTextFileSync } from "../../shared/fs/read";
import { writeTextFile } from "../../shared/fs/write";
import { createSha256Hex } from "../../shared/hashing/sha256";
import { parseFrontmatter } from "../../shared/markdown/frontmatter";
import {
  buildCachedMaps,
  compileNamingPattern,
  isPlainObject,
  listEntityMarkdownFiles,
  loadScanCache,
  parseChapterScenes,
  parseChapterStructure,
  reportUnknownManuscriptDirs,
  type SceneFieldName,
  toStringArray,
  validateChapterReferences,
  validateIdAgainstPattern,
  validateUniqueness,
} from "./helpers";
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

/** 扫描 manuscript 实体、校验引用关系，并持久化增量缓存。 */
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
  const cacheStats = {
    mode,
    loaded: Boolean(previousCache),
    written: writeCache,
    fastHits: 0,
    hashHits: 0,
    misses: 0,
  };

  const sortLocale = deps.config.index.stableSortLocale;
  const structureEnabled = deps.config.structure.enabled ?? true;
  const sceneEnabled = deps.config.scene.enabled ?? true;
  const sceneRequiredFields = new Set<SceneFieldName>(
    (deps.config.scene.required_fields ?? ["scene_id", "objective", "conflict", "outcome"]).filter(
      (field): field is SceneFieldName =>
        field === "scene_id" ||
        field === "objective" ||
        field === "conflict" ||
        field === "outcome" ||
        field === "hook",
    ),
  );

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

  reportUnknownManuscriptDirs({ manuscriptDir, rootDir, diagnostics });
  const { chapterFiles, characterFiles, threadFiles, factionFiles, locationFiles } =
    listEntityMarkdownFiles(manuscriptDir, { sortLocale });

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
      cacheStats.fastHits += 1;
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
      cacheStats.hashHits += 1;
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

    cacheStats.misses += 1;
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
        characters: toStringArray(data.characters),
        factions: toStringArray(data.factions),
        locations: toStringArray(data.locations),
        threads_opened: toStringArray(data.threads_opened),
        threads_advanced: toStringArray(data.threads_advanced),
        threads_closed: toStringArray(data.threads_closed),
        summary: typeof data.summary === "string" ? data.summary : undefined,
        tags: toStringArray(data.tags),
        structure: structureEnabled
          ? parseChapterStructure({
              raw: data.structure,
              file: relPath,
              strictMode,
              diagnostics,
            })
          : undefined,
        scenes: sceneEnabled
          ? parseChapterScenes({
              raw: data.scenes,
              file: relPath,
              strictMode,
              requiredFields: sceneRequiredFields,
              diagnostics,
            })
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
  characters.sort(
    (a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale),
  );
  threads.sort(
    (a, b) =>
      a.thread_id.localeCompare(b.thread_id, sortLocale) ||
      a.path.localeCompare(b.path, sortLocale),
  );
  factions.sort(
    (a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale),
  );
  locations.sort(
    (a, b) => a.id.localeCompare(b.id, sortLocale) || a.path.localeCompare(b.path, sortLocale),
  );

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

  validateChapterReferences({
    diagnostics,
    chapters,
    strictMode,
    definedCharacters,
    definedThreads,
    definedFactions,
    definedLocations,
  });

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
    cache: cacheStats,
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

/** 加载增量扫描缓存或执行扫描，并返回标准化结果。 */
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
