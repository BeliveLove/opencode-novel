import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { type ParseError, parse } from "jsonc-parser";
import { createDefaultNovelConfig } from "./defaults";
import type { NovelConfig } from "./schema";
import { NovelConfigSchema } from "./schema";

export type ConfigSource = "defaults" | "user" | "project";

export type ConfigLoadError = {
  source: ConfigSource;
  path?: string;
  message: string;
};

type PlainObject = Record<string, unknown>;

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) {
    return base;
  }
  if (Array.isArray(base) && Array.isArray(override)) {
    return override;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: PlainObject = { ...base };
    for (const [key, value] of Object.entries(override)) {
      merged[key] = deepMerge((base as PlainObject)[key], value);
    }
    return merged;
  }
  return override;
}

function uniqStrings(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (typeof value !== "string") continue;
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
}

function parseJsoncFile(path: string): { data: PlainObject | null; errors: string[] } {
  const errors: string[] = [];
  if (!existsSync(path)) {
    return { data: null, errors };
  }

  let raw = "";
  try {
    raw = readFileSync(path, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { data: null, errors: [`读取失败: ${message}`] };
  }

  const parseErrors: ParseError[] = [];
  const parsed = parse(raw, parseErrors) as unknown;
  if (parseErrors.length > 0) {
    errors.push(
      ...parseErrors.map(
        (e) => `JSONC 解析失败: code=${e.error} offset=${e.offset} length=${e.length}`,
      ),
    );
  }

  if (!isPlainObject(parsed)) {
    errors.push("配置内容不是对象（期望 JSON object）");
    return { data: null, errors };
  }

  return { data: parsed, errors };
}

function getUserConfigCandidates(): string[] {
  const home = homedir();
  const candidates = [join(home, ".config", "opencode", "novel.jsonc")];

  if (process.platform === "win32") {
    const userProfile = process.env.USERPROFILE;
    const appData = process.env.APPDATA;
    if (userProfile) {
      candidates.unshift(join(userProfile, ".config", "opencode", "novel.jsonc"));
    }
    if (appData) {
      candidates.push(join(appData, "opencode", "novel.jsonc"));
    }
  }

  return Array.from(new Set(candidates));
}

export function getProjectConfigPath(projectRoot: string): string {
  return join(projectRoot, ".opencode", "novel.jsonc");
}

export function loadNovelConfig(projectRoot: string): {
  config: NovelConfig;
  errors: ConfigLoadError[];
  sources: { user?: string; project?: string };
} {
  const errors: ConfigLoadError[] = [];

  const defaultConfig = createDefaultNovelConfig(projectRoot) as PlainObject;

  const userCandidates = getUserConfigCandidates();
  let userPath: string | undefined;
  let userConfig: PlainObject | null = null;
  for (const candidate of userCandidates) {
    const { data, errors: parseErrors } = parseJsoncFile(candidate);
    if (!data) {
      if (parseErrors.length > 0) {
        errors.push({ source: "user", path: candidate, message: parseErrors.join("; ") });
      }
      continue;
    }
    userPath = candidate;
    userConfig = data;
    if (parseErrors.length > 0) {
      errors.push({ source: "user", path: candidate, message: parseErrors.join("; ") });
    }
    break;
  }

  const projectPath = getProjectConfigPath(projectRoot);
  const { data: projectConfig, errors: projectParseErrors } = parseJsoncFile(projectPath);
  if (projectParseErrors.length > 0) {
    errors.push({ source: "project", path: projectPath, message: projectParseErrors.join("; ") });
  }

  const merged = deepMerge(
    deepMerge(defaultConfig, userConfig ?? undefined),
    projectConfig ?? undefined,
  ) as PlainObject;

  // Merge + de-dup disabled lists (stable order: defaults -> user -> project)
  const disabledCommands = [
    ...uniqStrings(defaultConfig.disabled_commands),
    ...uniqStrings(userConfig?.disabled_commands),
    ...uniqStrings(projectConfig?.disabled_commands),
  ];
  const disabledSkills = [
    ...uniqStrings(defaultConfig.disabled_skills),
    ...uniqStrings(userConfig?.disabled_skills),
    ...uniqStrings(projectConfig?.disabled_skills),
  ];
  const disabledRules = [
    ...uniqStrings(defaultConfig.disabled_rules),
    ...uniqStrings(userConfig?.disabled_rules),
    ...uniqStrings(projectConfig?.disabled_rules),
  ];
  const disabledAgents = [
    ...uniqStrings(defaultConfig.disabled_agents),
    ...uniqStrings(userConfig?.disabled_agents),
    ...uniqStrings(projectConfig?.disabled_agents),
  ];

  merged.disabled_commands = uniqStrings(disabledCommands);
  merged.disabled_skills = uniqStrings(disabledSkills);
  merged.disabled_rules = uniqStrings(disabledRules);
  merged.disabled_agents = uniqStrings(disabledAgents);

  // Ensure projectRoot is absolute + present
  merged.projectRoot = resolve(projectRoot);

  let config: NovelConfig;
  try {
    config = NovelConfigSchema.parse(merged);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push({ source: "defaults", message: `配置校验失败: ${message}` });
    config = NovelConfigSchema.parse({ projectRoot });
  }

  return {
    config,
    errors,
    sources: { user: userPath, project: existsSync(projectPath) ? projectPath : undefined },
  };
}
