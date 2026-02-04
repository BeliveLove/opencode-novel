import { dump, load } from "js-yaml";
import type { Diagnostic } from "../errors/diagnostics";
import { normalizeLf } from "../fs/write";

export type ParsedFrontmatter<T extends Record<string, unknown>> = {
  data: Partial<T>;
  body: string;
  hasFrontmatter: boolean;
  diagnostics: Diagnostic[];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseFrontmatter<T extends Record<string, unknown>>(
  content: string,
  options?: { file?: string; strict?: boolean },
): ParsedFrontmatter<T> {
  const diagnostics: Diagnostic[] = [];
  const normalized = normalizeLf(content);

  const withoutBom = normalized.startsWith("\uFEFF") ? normalized.slice(1) : normalized;

  // Allow UTF-8 BOM + leading blank lines before the frontmatter marker.
  // This avoids surprising "missing id" diagnostics when users copy/paste markdown from editors.
  const fmMatch = /^(?:[ \t]*\n)*---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/.exec(withoutBom);

  if (!fmMatch) {
    // If it looks like frontmatter started but never ended, emit a helpful diagnostic.
    const trimmedStart = withoutBom.replace(/^(?:[ \t]*\n)*/, "");
    if (/^---[ \t]*(?:\n|$)/.test(trimmedStart)) {
      diagnostics.push({
        severity: options?.strict ? "error" : "warn",
        code: "PARSE_FRONTMATTER",
        message: "Frontmatter 缺少结束标记 (---)。",
        file: options?.file,
      });
    }

    return { data: {}, body: withoutBom, hasFrontmatter: false, diagnostics };
  }

  const fmRaw = fmMatch[1];
  const rest = withoutBom.slice(fmMatch[0].length);
  const body = rest.startsWith("\n") ? rest.slice(1) : rest;

  try {
    const parsed = load(fmRaw) as unknown;
    if (!parsed) {
      return { data: {}, body, hasFrontmatter: true, diagnostics };
    }
    if (!isPlainObject(parsed)) {
      diagnostics.push({
        severity: options?.strict ? "error" : "warn",
        code: "PARSE_FRONTMATTER",
        message: "Frontmatter 不是对象结构。",
        file: options?.file,
      });
      return { data: {}, body, hasFrontmatter: true, diagnostics };
    }
    return { data: parsed as Partial<T>, body, hasFrontmatter: true, diagnostics };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    diagnostics.push({
      severity: options?.strict ? "error" : "warn",
      code: "PARSE_FRONTMATTER",
      message: `Frontmatter YAML 解析失败: ${message.split("\n")[0]}`,
      file: options?.file,
    });
    return { data: {}, body, hasFrontmatter: true, diagnostics };
  }
}

function isPlainObjectOrArray(value: unknown): value is Record<string, unknown> | unknown[] {
  return isPlainObject(value) || Array.isArray(value);
}

function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys);
  }
  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b));
    const result: Record<string, unknown> = {};
    for (const key of sortedKeys) {
      result[key] = deepSortKeys(value[key]);
    }
    return result;
  }
  return value;
}

export function serializeFrontmatter(
  data: Record<string, unknown>,
  options?: { lineWidth?: number },
): string {
  const sortable = isPlainObjectOrArray(data) ? deepSortKeys(data) : data;
  return dump(sortable, {
    lineWidth: options?.lineWidth ?? 120,
    noRefs: true,
    sortKeys: true,
  }).trimEnd();
}

export function buildFrontmatterFile(data: Record<string, unknown>, body: string): string {
  const yaml = serializeFrontmatter(data);
  const normalizedBody = normalizeLf(body).replace(/^\n+/, "");
  return `---\n${yaml}\n---\n\n${normalizedBody}`.replace(/\n+$/, "\n");
}
