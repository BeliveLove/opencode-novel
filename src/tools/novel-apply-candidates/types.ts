import type { Diagnostic } from "../../shared/errors/diagnostics"

export type NovelCandidatesV1 = {
  version: 1
  generatedAt: string
  scope: { kind: "all" } | { kind: "chapter"; chapter_id: string }
  notes?: string
  ops: CandidateOp[]
}

export type CandidateOp =
  | { op: "ensure_entity"; kind: "character" | "faction" | "location" | "thread"; id: string; name?: string; filePath?: string }
  | { op: "patch_frontmatter"; filePath: string; patch: Record<string, unknown>; mode?: "merge" | "replace" }

export type NovelApplyCandidatesArgs = {
  rootDir?: string
  candidatesPath?: string
  dryRun?: boolean
  writeReport?: boolean
}

export type NovelApplyCandidatesResultJson = {
  version: 1
  dryRun: boolean
  appliedOps: number
  writtenFiles: string[]
  skippedOps: { index: number; reason: string }[]
  reportPath?: string
  diagnostics: Diagnostic[]
}

