import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import type { NovelConfig } from "../../config/schema"
import type { Diagnostic } from "../../shared/errors/diagnostics"
import { fromRelativePosixPath, toRelativePosixPath } from "../../shared/fs/paths"
import { parseFrontmatter } from "../../shared/markdown/frontmatter"
import { writeTextFile } from "../../shared/fs/write"
import { formatToolMarkdownOutput } from "../../shared/tool-output"
import { loadOrScan } from "../novel-scan/scan"
import { renderThreadsReportMd } from "../novel-index/render"
import type { NovelForeshadowingArgs, NovelForeshadowingResultJson, ThreadAuditItem } from "./types"
import { renderForeshadowingAuditMd } from "./render"

type ThreadMeta = {
  opened_in?: string
  expected_close_by?: string
  closed_in?: string | null
  close_plan?: string
  status?: string
  type?: string
}

function readThreadMeta(rootDir: string, threadPath: string, diagnostics: Diagnostic[]): ThreadMeta {
  const abs = fromRelativePosixPath(rootDir, threadPath)
  if (!existsSync(abs)) return {}
  const content = readFileSync(abs, "utf8")
  const parsed = parseFrontmatter<Record<string, unknown>>(content, { file: threadPath, strict: false })
  diagnostics.push(...parsed.diagnostics)

  const data = parsed.data
  const openedObj = data.opened_in && typeof data.opened_in === "object" ? (data.opened_in as Record<string, unknown>) : undefined
  const opened_in = openedObj && typeof openedObj.chapter_id === "string" ? openedObj.chapter_id : undefined

  const expected_close_by = typeof data.expected_close_by === "string" ? data.expected_close_by : undefined
  const closed_in = typeof data.closed_in === "string" || data.closed_in === null ? (data.closed_in as string | null) : undefined
  const close_plan = typeof data.close_plan === "string" ? data.close_plan : undefined
  const status = typeof data.status === "string" ? data.status : undefined
  const type = typeof data.type === "string" ? data.type : undefined

  return { opened_in, expected_close_by, closed_in, close_plan, status, type }
}

export function createNovelForeshadowingAuditTool(deps: { projectRoot: string; config: NovelConfig }): ToolDefinition {
  return tool({
    description: "Audit threads (foreshadowing/promises) and produce FORESHADOWING_AUDIT.md and THREADS_REPORT.md.",
    args: {
      rootDir: tool.schema.string().optional(),
      manuscriptDir: tool.schema.string().optional(),
      outputDir: tool.schema.string().optional(),
      writeReport: tool.schema.boolean().optional(),
      strictMode: tool.schema.boolean().optional(),
    },
    async execute(args: NovelForeshadowingArgs) {
      const startedAt = Date.now()
      const diagnostics: Diagnostic[] = []

      const rootDir = path.resolve(args.rootDir ?? deps.projectRoot)
      const manuscriptDirName = args.manuscriptDir ?? deps.config.manuscriptDir
      const outputDir = path.isAbsolute(args.outputDir ?? "")
        ? (args.outputDir as string)
        : path.resolve(path.join(rootDir, args.outputDir ?? deps.config.index.outputDir))
      const writeReport = args.writeReport ?? true
      const strictMode = args.strictMode ?? deps.config.continuity.strictMode ?? false

      const scan = loadOrScan({
        projectRoot: deps.projectRoot,
        config: deps.config,
        args: { rootDir, manuscriptDir: manuscriptDirName, mode: "incremental", writeCache: true },
      })
      diagnostics.push(...scan.diagnostics)

      const chapterIdSet = new Set(scan.entities.chapters.map((c) => c.chapter_id))

      const items: ThreadAuditItem[] = []
      const threadsReport = scan.entities.threads.map((t) => {
        const meta = readThreadMeta(rootDir, t.path, diagnostics)
        return { ...t, ...meta }
      })

      for (const t of threadsReport) {
        const issues: ThreadAuditItem["issues"] = []

        const status = t.status ?? "open"
        const closePlan = (t as unknown as ThreadMeta).close_plan

        if ((status === "open" || status === "in_progress") && (!closePlan || closePlan.trim().length === 0)) {
          const severity = deps.config.threads.requireClosePlan ? (strictMode ? "error" : "warn") : "info"
          issues.push({
            severity,
            code: "THREAD_NO_CLOSE_PLAN",
            message: "线程未回收但缺少 close_plan。",
          })
        }

        if (status === "closed" && !t.closed_in) {
          issues.push({
            severity: "warn",
            code: "THREAD_CLOSED_MISSING_CLOSED_IN",
            message: "线程 status=closed 但 closed_in 为空。",
          })
        }

        if (typeof t.expected_close_by === "string" && !chapterIdSet.has(t.expected_close_by)) {
          issues.push({
            severity: "warn",
            code: "THREAD_EXPECTED_CLOSE_INVALID",
            message: `expected_close_by 指向不存在章节: ${t.expected_close_by}`,
          })
        }

        if (typeof t.closed_in === "string" && !chapterIdSet.has(t.closed_in)) {
          issues.push({
            severity: strictMode ? "error" : "warn",
            code: "THREAD_CLOSED_IN_INVALID",
            message: `closed_in 指向不存在章节: ${t.closed_in}`,
          })
        }

        const suggestedNextStep = issues.some((i) => i.code === "THREAD_NO_CLOSE_PLAN")
          ? "补充 close_plan，并在合适章节标注 threads_closed。"
          : issues.some((i) => i.code.includes("INVALID"))
            ? "修正 thread 卡的章节引用（opened_in/expected_close_by/closed_in）。"
            : undefined

        items.push({
          thread_id: t.thread_id,
          type: t.type,
          status: t.status,
          opened_in: t.opened_in,
          expected_close_by: t.expected_close_by,
          closed_in: t.closed_in ?? null,
          issues,
          suggestedNextStep,
        })
      }

      items.sort((a, b) => a.thread_id.localeCompare(b.thread_id))

      const counts = { open: 0, in_progress: 0, closed: 0, abandoned: 0 }
      for (const item of items) {
        const s = (item.status ?? "open") as keyof typeof counts
        if (counts[s] !== undefined) counts[s] += 1
      }

      const auditPathAbs = path.join(outputDir, "FORESHADOWING_AUDIT.md")
      const auditPathRel = toRelativePosixPath(rootDir, auditPathAbs)
      const threadsReportPathAbs = path.join(outputDir, "THREADS_REPORT.md")
      const threadsReportPathRel = toRelativePosixPath(rootDir, threadsReportPathAbs)

      if (writeReport) {
        writeTextFile(auditPathAbs, renderForeshadowingAuditMd({ items, stats: counts }), { mode: "if-changed" })
        writeTextFile(threadsReportPathAbs, renderThreadsReportMd({ threads: threadsReport }), { mode: "if-changed" })
      }

      const durationMs = Date.now() - startedAt
      const resultJson: NovelForeshadowingResultJson = {
        version: 1,
        reportPath: writeReport ? auditPathRel : undefined,
        stats: { ...counts, durationMs },
        items,
        diagnostics,
      }

      return formatToolMarkdownOutput({
        summaryLines: [
          `open: ${counts.open}`,
          `in_progress: ${counts.in_progress}`,
          `closed: ${counts.closed}`,
          `abandoned: ${counts.abandoned}`,
          `durationMs: ${durationMs}`,
          `reportPath: ${writeReport ? auditPathRel : "(dry)"}`,
          `threadsReportPath: ${writeReport ? threadsReportPathRel : "(dry)"}`,
        ],
        resultJson,
        diagnostics,
      })
    },
  })
}

