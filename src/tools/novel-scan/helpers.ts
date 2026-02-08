import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import type { Diagnostic } from "../../shared/errors/diagnostics";
import { toRelativePosixPath } from "../../shared/fs/paths";
import type {
  ChapterEntity,
  ChapterSceneEntity,
  ChapterStructureEntity,
  CharacterEntity,
  FactionEntity,
  LocationEntity,
  NovelFileHash,
  ScanCacheV1,
  ThreadEntity,
} from "./types";

export type CachedMaps = {
  fileByPath: Map<string, NovelFileHash>;
  chapterByPath: Map<string, ChapterEntity>;
  characterByPath: Map<string, CharacterEntity>;
  threadByPath: Map<string, ThreadEntity>;
  factionByPath: Map<string, FactionEntity>;
  locationByPath: Map<string, LocationEntity>;
  perFileDiagnostics: Map<string, Diagnostic[]>;
};

export type EntityMarkdownFiles = {
  chapterFiles: string[];
  characterFiles: string[];
  threadFiles: string[];
  factionFiles: string[];
  locationFiles: string[];
};

/** 递归列出目录下的 Markdown 文件，并按稳定顺序排序。 */
export function listMarkdownFiles(dir: string, options?: { sortLocale?: string }): string[] {
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

/** 解析 manuscript 标准实体目录并返回对应 Markdown 文件列表。 */
export function listEntityMarkdownFiles(
  manuscriptDir: string,
  options?: { sortLocale?: string },
): EntityMarkdownFiles {
  return {
    chapterFiles: listMarkdownFiles(join(manuscriptDir, "chapters"), options),
    characterFiles: listMarkdownFiles(join(manuscriptDir, "characters"), options),
    threadFiles: listMarkdownFiles(join(manuscriptDir, "threads"), options),
    factionFiles: listMarkdownFiles(join(manuscriptDir, "factions"), options),
    locationFiles: listMarkdownFiles(join(manuscriptDir, "locations"), options),
  };
}

/** 对 manuscript 根目录下的未知一级目录输出诊断信息。 */
export function reportUnknownManuscriptDirs(options: {
  manuscriptDir: string;
  rootDir: string;
  diagnostics: Diagnostic[];
}) {
  const expectedSubdirs = new Set([
    "chapters",
    "characters",
    "threads",
    "factions",
    "locations",
    "bible",
    "snapshots",
  ]);

  if (!existsSync(options.manuscriptDir)) return;
  const entries = readdirSync(options.manuscriptDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (expectedSubdirs.has(entry.name)) continue;
    options.diagnostics.push({
      severity: "info",
      code: "SCAN_UNKNOWN_DIR",
      message: `未知目录已忽略: ${entry.name}`,
      file: toRelativePosixPath(options.rootDir, join(options.manuscriptDir, entry.name)),
    });
  }
}

/** 读取并校验增量扫描缓存。 */
export function loadScanCache(cachePath: string): ScanCacheV1 | null {
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

/** 基于扫描缓存构建快速查找映射。 */
export function buildCachedMaps(cache: ScanCacheV1 | null): CachedMaps {
  const maps: CachedMaps = {
    fileByPath: new Map<string, NovelFileHash>(),
    chapterByPath: new Map<string, ChapterEntity>(),
    characterByPath: new Map<string, CharacterEntity>(),
    threadByPath: new Map<string, ThreadEntity>(),
    factionByPath: new Map<string, FactionEntity>(),
    locationByPath: new Map<string, LocationEntity>(),
    perFileDiagnostics: new Map<string, Diagnostic[]>(),
  };

  if (!cache) return maps;

  for (const file of cache.files ?? []) {
    maps.fileByPath.set(file.path, file);
  }
  for (const entity of cache.entities?.chapters ?? []) {
    maps.chapterByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.characters ?? []) {
    maps.characterByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.threads ?? []) {
    maps.threadByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.factions ?? []) {
    maps.factionByPath.set(entity.path, entity);
  }
  for (const entity of cache.entities?.locations ?? []) {
    maps.locationByPath.set(entity.path, entity);
  }

  const cachedPerFile = cache.__internal?.perFileDiagnostics ?? {};
  for (const [path, list] of Object.entries(cachedPerFile)) {
    if (Array.isArray(list)) {
      maps.perFileDiagnostics.set(path, list as Diagnostic[]);
    }
  }

  return maps;
}

/** 校验实体集合中的重复 ID。 */
export function validateUniqueness(
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

/** 编译配置中的命名正则，并在无效时输出诊断。 */
export function compileNamingPattern(options: {
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

/** 使用配置命名规则校验实体 ID。 */
export function validateIdAgainstPattern(options: {
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

/** 将未知值规范化为去首尾空白后的非空字符串。 */
function normalizeNonEmptyString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** 将未知数组值转换为字符串数组。 */
export function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((x): x is string => typeof x === "string");
  return values.length > 0 ? values : [];
}

/** 将数值/字符串形式的 act 解析为正整数。 */
function parseActValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    const integer = Math.trunc(value);
    return integer > 0 ? integer : undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return undefined;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return undefined;
    return parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

/** 从 frontmatter 解析章节结构元数据。 */
export function parseChapterStructure(options: {
  raw: unknown;
  file: string;
  strictMode: boolean;
  diagnostics: Diagnostic[];
}): ChapterStructureEntity | undefined {
  if (options.raw === undefined) return undefined;
  if (!isPlainObject(options.raw)) {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_STRUCTURE_INVALID",
      message: "structure 必须为对象类型。",
      file: options.file,
      suggestedFix:
        "使用 structure.act / structure.beat_id / structure.beat_goal。示例：structure: { act: 1, beat_id: setup }。",
    });
    return undefined;
  }

  const structure = options.raw;
  const act = parseActValue(structure.act);
  if (structure.act !== undefined && act === undefined) {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_STRUCTURE_ACT_INVALID",
      message: "structure.act 必须是正整数。",
      file: options.file,
      suggestedFix: "将 structure.act 调整为 1/2/3 等正整数。",
    });
  }

  const beatId = normalizeNonEmptyString(structure.beat_id);
  if (structure.beat_id !== undefined && !beatId) {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_STRUCTURE_BEAT_ID_INVALID",
      message: "structure.beat_id 必须是非空字符串。",
      file: options.file,
      suggestedFix: "建议填写关键节拍，如 setup/inciting_incident/midpoint/climax/resolution。",
    });
  }

  const beatGoal = normalizeNonEmptyString(structure.beat_goal);
  if (structure.beat_goal !== undefined && !beatGoal) {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_STRUCTURE_BEAT_GOAL_INVALID",
      message: "structure.beat_goal 必须是非空字符串。",
      file: options.file,
      suggestedFix: "为该章节补充节拍目标描述。",
    });
  }

  if (act === undefined && !beatId && !beatGoal) return undefined;
  return {
    act,
    beat_id: beatId,
    beat_goal: beatGoal,
  };
}

export type SceneFieldName = keyof Pick<
  ChapterSceneEntity,
  "scene_id" | "objective" | "conflict" | "outcome" | "hook"
>;

/** 解析章节 scenes 元数据并输出场景级诊断。 */
export function parseChapterScenes(options: {
  raw: unknown;
  file: string;
  strictMode: boolean;
  requiredFields: Set<SceneFieldName>;
  diagnostics: Diagnostic[];
}): ChapterSceneEntity[] | undefined {
  if (options.raw === undefined) return undefined;
  if (!Array.isArray(options.raw)) {
    options.diagnostics.push({
      severity: options.strictMode ? "error" : "warn",
      code: "SCAN_SCENES_INVALID",
      message: "scenes 必须是数组类型。",
      file: options.file,
      suggestedFix: "请使用 scenes: []，每个元素为 scene 对象。",
    });
    return undefined;
  }

  const scenes: ChapterSceneEntity[] = [];
  const sceneIdSeen = new Set<string>();

  for (let index = 0; index < options.raw.length; index += 1) {
    const item = options.raw[index];
    if (!isPlainObject(item)) {
      options.diagnostics.push({
        severity: options.strictMode ? "error" : "warn",
        code: "SCAN_SCENE_ITEM_INVALID",
        message: `scenes[${index}] 必须是对象类型。`,
        file: options.file,
        suggestedFix:
          "scene 需包含 scene_id/objective/conflict/outcome 等字段，例如 scenes: [{ scene_id: ch0001-s01, objective: ... }].",
      });
      continue;
    }

    const scene: ChapterSceneEntity = {
      scene_id: normalizeNonEmptyString(item.scene_id),
      objective: normalizeNonEmptyString(item.objective),
      conflict: normalizeNonEmptyString(item.conflict),
      outcome: normalizeNonEmptyString(item.outcome),
      hook: normalizeNonEmptyString(item.hook),
    };

    const invalidFields: SceneFieldName[] = [];
    for (const field of ["scene_id", "objective", "conflict", "outcome", "hook"] as const) {
      if (item[field] !== undefined && !scene[field]) {
        invalidFields.push(field);
      }
    }
    for (const field of invalidFields) {
      options.diagnostics.push({
        severity: options.strictMode ? "error" : "warn",
        code: "SCAN_SCENE_FIELD_INVALID",
        message: `scenes[${index}].${field} 必须是非空字符串。`,
        file: options.file,
      });
    }

    for (const field of options.requiredFields) {
      if (!scene[field]) {
        options.diagnostics.push({
          severity: options.strictMode ? "error" : "warn",
          code: "SCAN_SCENE_REQUIRED_FIELD_MISSING",
          message: `scenes[${index}] 缺少必填字段: ${field}。`,
          file: options.file,
          suggestedFix: `为 scenes[${index}] 补充 ${field}。`,
        });
      }
    }

    if (scene.scene_id) {
      if (sceneIdSeen.has(scene.scene_id)) {
        options.diagnostics.push({
          severity: options.strictMode ? "error" : "warn",
          code: "SCAN_SCENE_ID_DUPLICATE",
          message: `scenes 出现重复 scene_id: ${scene.scene_id}。`,
          file: options.file,
          suggestedFix: "请确保同一章节内 scene_id 唯一。",
        });
      }
      sceneIdSeen.add(scene.scene_id);
    }

    scenes.push(scene);
  }

  return scenes;
}

/** 基于已定义实体 ID 校验章节中的跨实体引用。 */
export function validateChapterReferences(options: {
  diagnostics: Diagnostic[];
  chapters: ChapterEntity[];
  strictMode: boolean;
  definedCharacters: Set<string>;
  definedThreads: Set<string>;
  definedFactions: Set<string>;
  definedLocations: Set<string>;
}) {
  for (const chapter of options.chapters) {
    for (const charId of chapter.characters ?? []) {
      if (!options.definedCharacters.has(charId)) {
        options.diagnostics.push({
          severity: options.strictMode ? "error" : "warn",
          code: "SCAN_REF_CHARACTER_UNDEFINED",
          message: `章节引用了未定义角色: ${charId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/characters/${charId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    for (const factionId of chapter.factions ?? []) {
      if (!options.definedFactions.has(factionId)) {
        options.diagnostics.push({
          severity: options.strictMode ? "warn" : "info",
          code: "SCAN_REF_FACTION_UNDEFINED",
          message: `章节引用了未定义势力: ${factionId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/factions/${factionId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    for (const locationId of chapter.locations ?? []) {
      if (!options.definedLocations.has(locationId)) {
        options.diagnostics.push({
          severity: options.strictMode ? "warn" : "info",
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
      if (!options.definedThreads.has(threadId)) {
        options.diagnostics.push({
          severity: options.strictMode ? "warn" : "info",
          code: "SCAN_REF_THREAD_UNDEFINED",
          message: `章节引用了未定义线程: ${threadId}`,
          file: chapter.path,
          suggestedFix: `创建 manuscript/threads/${threadId}.md 或从 chapters/${chapter.chapter_id}.md 中移除该引用。`,
        });
      }
    }

    const locationId = chapter.timeline?.location;
    if (locationId && !options.definedLocations.has(locationId)) {
      options.diagnostics.push({
        severity: options.strictMode ? "warn" : "info",
        code: "SCAN_REF_LOCATION_UNDEFINED",
        message: `章节引用了未定义地点(timeline.location): ${locationId}`,
        file: chapter.path,
        suggestedFix: `创建 manuscript/locations/${locationId}.md 或更新 timeline.location。`,
      });
    }
  }
}

/** 判断值是否为普通对象（排除数组）。 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
