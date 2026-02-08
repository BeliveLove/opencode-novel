import type { Diagnostic, DiagnosticEvidence } from "../../shared/errors/diagnostics";

export type NovelStructureScope = { kind: "all" } | { kind: "chapter"; chapter_id: string };

export type NovelStructureArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  scope?: NovelStructureScope;
  writeReport?: boolean;
  requiredBeats?: string[];
  minCoverage?: number;
};

export type StructureFinding = {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
  evidence: DiagnosticEvidence[];
  suggestedFix?: string;
  repro?: string;
};

export type NovelStructureResultJson = {
  version: 1;
  reportPath?: string;
  stats: {
    coverage: number;
    requiredBeats: number;
    seenRequiredBeats: number;
    missing: number;
    orderErrors: number;
    errors: number;
    warns: number;
    infos: number;
    durationMs: number;
  };
  findings: StructureFinding[];
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
