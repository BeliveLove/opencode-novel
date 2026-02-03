import type { Diagnostic, DiagnosticEvidence } from "../../shared/errors/diagnostics"

export type NovelStyleScope =
  | { kind: "all" }
  | { kind: "chapter"; chapter_id: string }
  | { kind: "character"; id: string }

export type NovelStyleArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string
  scope?: NovelStyleScope
  writeReport?: boolean
}

export type StyleFinding = {
  severity: "warn" | "info"
  code: string
  message: string
  evidence: DiagnosticEvidence[]
  suggestedFix?: string
}

export type NovelStyleResultJson = {
  version: 1
  reportPath?: string
  stats: { warns: number; infos: number; durationMs: number }
  findings: StyleFinding[]
  diagnostics: Diagnostic[]
}

