import type { Diagnostic, DiagnosticEvidence } from "../../shared/errors/diagnostics";

export type NovelContinuityScope = { kind: "all" } | { kind: "chapter"; chapter_id: string };

export type NovelContinuityArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  scope?: NovelContinuityScope;
  strictMode?: boolean;
  writeReport?: boolean;
};

export type ContinuitySeverity = "error" | "warn" | "info";

export type ContinuityFinding = {
  ruleId: string;
  severity: ContinuitySeverity;
  message: string;
  evidence: DiagnosticEvidence[];
  suggestedFix?: string;
};

export type NovelContinuityResultJson = {
  version: 1;
  reportPath?: string;
  stats: { errors: number; warns: number; infos: number; durationMs: number };
  findings: ContinuityFinding[];
  diagnostics: Diagnostic[];
};
