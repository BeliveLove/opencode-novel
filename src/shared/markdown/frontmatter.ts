import { load, dump } from "js-yaml"
import type { Diagnostic } from "../errors/diagnostics"
import { normalizeLf } from "../fs/write"

export type ParsedFrontmatter<T extends Record<string, unknown>> = {
  data: Partial<T>
  body: string
  hasFrontmatter: boolean
  diagnostics: Diagnostic[]
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export function parseFrontmatter<T extends Record<string, unknown>>(
  content: string,
  options?: { file?: string; strict?: boolean },
): ParsedFrontmatter<T> {
  const diagnostics: Diagnostic[] = []
  const normalized = normalizeLf(content)

  if (!normalized.startsWith("---\n")) {
    return { data: {}, body: normalized, hasFrontmatter: false, diagnostics }
  }

  const endIndex = normalized.indexOf("\n---", 4)
  if (endIndex === -1) {
    diagnostics.push({
      severity: options?.strict ? "error" : "warn",
      code: "PARSE_FRONTMATTER",
      message: "Frontmatter 缺少结束标记 (---)。",
      file: options?.file,
    })
    return { data: {}, body: normalized, hasFrontmatter: false, diagnostics }
  }

  const fmRaw = normalized.slice(4, endIndex + 1)
  const rest = normalized.slice(endIndex + "\n---".length)
  const body = rest.startsWith("\n") ? rest.slice(1) : rest

  try {
    const parsed = load(fmRaw) as unknown
    if (!parsed) {
      return { data: {}, body, hasFrontmatter: true, diagnostics }
    }
    if (!isPlainObject(parsed)) {
      diagnostics.push({
        severity: options?.strict ? "error" : "warn",
        code: "PARSE_FRONTMATTER",
        message: "Frontmatter 不是对象结构。",
        file: options?.file,
      })
      return { data: {}, body, hasFrontmatter: true, diagnostics }
    }
    return { data: parsed as Partial<T>, body, hasFrontmatter: true, diagnostics }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    diagnostics.push({
      severity: options?.strict ? "error" : "warn",
      code: "PARSE_FRONTMATTER",
      message: `Frontmatter YAML 解析失败: ${message.split("\n")[0]}`,
      file: options?.file,
    })
    return { data: {}, body, hasFrontmatter: true, diagnostics }
  }
}

function isPlainObjectOrArray(value: unknown): value is Record<string, unknown> | unknown[] {
  return isPlainObject(value) || Array.isArray(value)
}

function deepSortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepSortKeys)
  }
  if (isPlainObject(value)) {
    const sortedKeys = Object.keys(value).sort((a, b) => a.localeCompare(b))
    const result: Record<string, unknown> = {}
    for (const key of sortedKeys) {
      result[key] = deepSortKeys(value[key])
    }
    return result
  }
  return value
}

export function serializeFrontmatter(
  data: Record<string, unknown>,
  options?: { lineWidth?: number },
): string {
  const sortable = isPlainObjectOrArray(data) ? deepSortKeys(data) : data
  return dump(sortable, {
    lineWidth: options?.lineWidth ?? 120,
    noRefs: true,
    sortKeys: true,
  }).trimEnd()
}

export function buildFrontmatterFile(data: Record<string, unknown>, body: string): string {
  const yaml = serializeFrontmatter(data)
  const normalizedBody = normalizeLf(body).replace(/^\n+/, "")
  return `---\n${yaml}\n---\n\n${normalizedBody}`.replace(/\n+$/, "\n")
}

