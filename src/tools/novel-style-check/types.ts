import type { Diagnostic, DiagnosticEvidence } from "../../shared/errors/diagnostics";

export type NovelStyleScope =
  | { kind: "all" }
  | { kind: "chapter"; chapter_id: string }
  | { kind: "character"; id: string };

export type NovelStyleArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  scope?: NovelStyleScope;
  catchphraseMaxCount?: number;
  catchphraseReportMissing?: boolean;
  writeReport?: boolean;
};

export type StyleFinding = {
  severity: "warn" | "info";
  code: string;
  message: string;
  evidence: DiagnosticEvidence[];
  suggestedFix?: string;
  repro?: string;
};

export type NovelStyleResultJson = {
  version: 1;
  reportPath?: string;
  stats: { warns: number; infos: number; durationMs: number };
  findings: StyleFinding[];
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
