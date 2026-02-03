import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { NovelConfig } from "../../config/schema"
import type { Diagnostic } from "../../shared/errors/diagnostics"
import { toRelativePosixPath } from "../../shared/fs/paths"
import { hash8 } from "../../shared/hashing/hash8"
import { buildFrontmatterFile, parseFrontmatter } from "../../shared/markdown/frontmatter"
import { writeTextFile } from "../../shared/fs/write"
import { formatToolMarkdownOutput } from "../../shared/tool-output"
import type { CandidateOp, NovelApplyCandidatesArgs, NovelApplyCandidatesResultJson, NovelCandidatesV1 } from "./types"
import { renderApplyReportMd } from "./render"

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function deepMerge(base: unknown, override: unknown): unknown {
  if (override === undefined) return base
  if (Array.isArray(base) && Array.isArray(override)) return override
  if (isPlainObject(base) && isPlainObject(override)) {
    const out: PlainObject = { ...base }
    for (const [k, v] of Object.entries(override)) {
      out[k] = deepMerge((base as PlainObject)[k], v)
    }
    return out
  }
  return override
}

function parseCandidates(raw: string): { data: NovelCandidatesV1 | null; error?: string } {
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== "object") return { data: null, error: "candidates 不是对象" }
    const obj = parsed as Partial<NovelCandidatesV1>
    if (obj.version !== 1) return { data: null, error: "candidates.version 必须为 1" }
    if (!Array.isArray(obj.ops)) return { data: null, error: "candidates.ops 必须为数组" }
    if (typeof obj.generatedAt !== "string") return { data: null, error: "candidates.generatedAt 必须为 string" }
    if (!obj.scope || typeof obj.scope !== "object") return { data: null, error: "candidates.scope 缺失" }
    return { data: obj as NovelCandidatesV1 }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return { data: null, error: `JSON.parse 失败: ${message}` }
  }
}

type EnsureEntityKind = Extract<CandidateOp, { op: "ensure_entity" }>["kind"]

function kindPlural(kind: EnsureEntityKind): string {
  if (kind === "character") return "characters"
  if (kind === "thread") return "threads"
  if (kind === "faction") return "factions"
  return "locations"
}

function isUnderDir(filePathAbs: string, dirAbs: string): boolean {
  const normalizedFile = path.resolve(filePathAbs).toLowerCase()
  const normalizedDir = path.resolve(dirAbs).toLowerCase()
  return normalizedFile === normalizedDir || normalizedFile.startsWith(normalizedDir + path.sep.toLowerCase())
}

export function createNovelApplyCandidatesTool(deps: { projectRoot: string; config: NovelConfig }): ToolDefinition {
  return tool({
    description:
      "Apply LLM candidates safely: create missing entity files and patch YAML frontmatter only (never modify正文).",
    args: {
      rootDir: tool.schema.string().optional(),
      candidatesPath: tool.schema.string().optional(),
      dryRun: tool.schema.boolean().optional(),
      writeReport: tool.schema.boolean().optional(),
    },
    async execute(args: NovelApplyCandidatesArgs) {
      const startedAt = Date.now()
      const diagnostics: Diagnostic[] = []

      const rootDir = path.resolve(args.rootDir ?? deps.projectRoot)
      const candidatesPath = args.candidatesPath ?? `${deps.config.index.cacheDir}/candidates.json`
      const candidatesPathAbs = path.isAbsolute(candidatesPath)
        ? candidatesPath
        : path.resolve(path.join(rootDir, candidatesPath))
      const dryRun = args.dryRun ?? true
      const writeReport = args.writeReport ?? true

      let raw: string
      try {
        raw = readFileSync(candidatesPathAbs, "utf8")
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        diagnostics.push({
          severity: "error",
          code: "APPLY_READ_CANDIDATES_FAIL",
          message: `读取 candidates 失败: ${message}`,
          file: toRelativePosixPath(rootDir, candidatesPathAbs),
        })
        const resultJson: NovelApplyCandidatesResultJson = {
          version: 1,
          dryRun,
          appliedOps: 0,
          writtenFiles: [],
          skippedOps: [],
          diagnostics,
        }
        return formatToolMarkdownOutput({
          summaryLines: ["status: failed"],
          resultJson,
          diagnostics,
        })
      }

      const parsed = parseCandidates(raw)
      if (!parsed.data) {
        diagnostics.push({
          severity: "error",
          code: "APPLY_INVALID_CANDIDATES",
          message: parsed.error ?? "candidates 无效",
          file: toRelativePosixPath(rootDir, candidatesPathAbs),
        })
        const resultJson: NovelApplyCandidatesResultJson = {
          version: 1,
          dryRun,
          appliedOps: 0,
          writtenFiles: [],
          skippedOps: [],
          diagnostics,
        }
        return formatToolMarkdownOutput({
          summaryLines: ["status: failed"],
          resultJson,
          diagnostics,
        })
      }

      const manuscriptDirAbs = path.resolve(path.join(rootDir, deps.config.manuscriptDir))
      const writtenFiles: string[] = []
      const skippedOps: { index: number; reason: string }[] = []
      let appliedOps = 0

      type AnyCandidateOp = { op: string } & Record<string, unknown>
      const ops = parsed.data.ops as unknown[]
      for (let i = 0; i < ops.length; i += 1) {
        const op = ops[i] as AnyCandidateOp
        if (!op || typeof op !== "object" || typeof op.op !== "string") {
          skippedOps.push({ index: i, reason: "op 非法" })
          continue
        }

        if (op.op === "ensure_entity") {
          if (!("kind" in op) || !("id" in op) || typeof op.kind !== "string" || typeof op.id !== "string") {
            skippedOps.push({ index: i, reason: "ensure_entity 缺少 kind/id" })
            continue
          }
          const kind = op.kind as EnsureEntityKind
          const id = op.id
          const name = typeof op.name === "string" ? op.name : undefined
          const rel =
            typeof op.filePath === "string"
              ? op.filePath
              : `${deps.config.manuscriptDir}/${kindPlural(kind)}/${id}.md`
          const abs = path.isAbsolute(rel) ? rel : path.join(rootDir, rel.replaceAll("/", path.sep))

          if (!isUnderDir(abs, manuscriptDirAbs)) {
            diagnostics.push({
              severity: "error",
              code: "APPLY_PATH_OUTSIDE_MANUSCRIPT",
              message: `ensure_entity 目标不在 manuscript/**: ${rel}`,
            })
            skippedOps.push({ index: i, reason: "目标不在 manuscript/**" })
            continue
          }

          if (existsSync(abs)) {
            skippedOps.push({ index: i, reason: "文件已存在" })
            continue
          }

          const content =
            kind === "thread"
              ? buildFrontmatterFile(
                  { thread_id: id, type: "mystery", status: "open", close_plan: "TODO" },
                  `# ${id}\n\n## TODO\n- 补全该线程的提出点/推进点/回收计划\n`,
                )
              : buildFrontmatterFile(
                  { id, name: name ?? id },
                  `# ${name ?? id}\n\n## TODO\n- 补全该实体的关键信息\n`,
                )

          if (!dryRun) {
            writeTextFile(abs, content, { mode: "always" })
          }
          writtenFiles.push(toRelativePosixPath(rootDir, abs))
          appliedOps += 1
          continue
        }

        if (op.op === "patch_frontmatter") {
          if (typeof op.filePath !== "string" || !("patch" in op) || !isPlainObject(op.patch)) {
            skippedOps.push({ index: i, reason: "patch_frontmatter 缺少 filePath/patch" })
            continue
          }
          const rel = op.filePath
          const abs = path.isAbsolute(rel) ? rel : path.join(rootDir, rel.replaceAll("/", path.sep))

          if (!isUnderDir(abs, manuscriptDirAbs)) {
            diagnostics.push({
              severity: "error",
              code: "APPLY_PATH_OUTSIDE_MANUSCRIPT",
              message: `patch_frontmatter 目标不在 manuscript/**: ${rel}`,
            })
            skippedOps.push({ index: i, reason: "目标不在 manuscript/**" })
            continue
          }

          const exists = existsSync(abs)
          if (!exists) {
            skippedOps.push({ index: i, reason: "目标文件不存在" })
            continue
          }

          const content = readFileSync(abs, "utf8")
          const parsedFm = parseFrontmatter<Record<string, unknown>>(content, { file: rel, strict: false })

          const currentData = isPlainObject(parsedFm.data) ? (parsedFm.data as PlainObject) : {}
          const nextData =
            op.mode === "replace"
              ? { ...currentData, ...(op.patch as PlainObject) }
              : (deepMerge(currentData, op.patch) as PlainObject)

          const rebuilt = buildFrontmatterFile(nextData, parsedFm.body)

          if (!dryRun) {
            writeTextFile(abs, rebuilt, { mode: "always" })
          }
          writtenFiles.push(toRelativePosixPath(rootDir, abs))
          appliedOps += 1
          continue
        }

        skippedOps.push({ index: i, reason: `未知 op: ${op.op}` })
      }

      const reportPathAbs = path.join(rootDir, deps.config.index.outputDir, "APPLY_REPORT.md")
      const reportPathRel = toRelativePosixPath(rootDir, reportPathAbs)

      const resultJson: NovelApplyCandidatesResultJson = {
        version: 1,
        dryRun,
        appliedOps,
        writtenFiles: Array.from(new Set(writtenFiles)).sort(),
        skippedOps,
        reportPath: writeReport ? reportPathRel : undefined,
        diagnostics,
      }

      if (writeReport) {
        writeTextFile(reportPathAbs, renderApplyReportMd(resultJson), { mode: "if-changed" })
      }

      const durationMs = Date.now() - startedAt
      return formatToolMarkdownOutput({
        summaryLines: [
          `dryRun: ${dryRun}`,
          `appliedOps: ${appliedOps}`,
          `writtenFiles: ${resultJson.writtenFiles.length}`,
          `skippedOps: ${skippedOps.length}`,
          `durationMs: ${durationMs}`,
        ],
        resultJson,
        diagnostics,
      })
    },
  })
}
