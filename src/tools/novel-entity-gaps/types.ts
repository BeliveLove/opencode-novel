import type { Diagnostic } from "../../shared/errors/diagnostics"

export type NovelEntityKind = "characters" | "threads" | "factions" | "locations"

export type NovelEntityGapsArgs = {
  rootDir?: string
  manuscriptDir?: string
  outputDir?: string
  writeReport?: boolean
  createStubs?: boolean
  stubPolicy?: "skip" | "write"
}

export type MissingEntityRef = {
  kind: NovelEntityKind
  id: string
  referencedBy: { chapter_id: string; path: string }[]
  suggestedPath: string
}

export type OrphanEntity = {
  kind: NovelEntityKind
  id: string
  path: string
}

export type NovelEntityGapsResultJson = {
  version: 1
  reportPath?: string
  missing: MissingEntityRef[]
  orphans: OrphanEntity[]
  createdStubs: string[]
  diagnostics: Diagnostic[]
}

