import type { Diagnostic } from "../../shared/errors/diagnostics"

export type NovelExportFormat = "md" | "html" | "epub" | "docx"
export type NovelChapterOrder = "by_id" | "by_timeline" | "custom"

export type NovelExportArgs = {
  rootDir?: string
  manuscriptDir?: string
  format: NovelExportFormat
  outputDir?: string
  title?: string
  chapterOrder?: NovelChapterOrder
  customOrder?: string[]
  includeFrontmatter?: boolean
  writeFile?: boolean
}

export type NovelExportResultJson = {
  version: 1
  format: NovelExportFormat
  outputPath?: string
  chapters: { chapter_id: string; title?: string; path: string }[]
  stats: { chapters: number; durationMs: number }
  diagnostics: Diagnostic[]
}

