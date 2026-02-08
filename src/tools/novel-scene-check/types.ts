import type { Diagnostic, DiagnosticEvidence } from "../../shared/errors/diagnostics";

export type NovelSceneScope = { kind: "all" } | { kind: "chapter"; chapter_id: string };

export type NovelSceneArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  scope?: NovelSceneScope;
  writeReport?: boolean;
  requiredFields?: Array<"scene_id" | "objective" | "conflict" | "outcome" | "hook">;
};

export type SceneFinding = {
  severity: "error" | "warn" | "info";
  code: string;
  message: string;
  evidence: DiagnosticEvidence[];
  suggestedFix?: string;
  repro?: string;
};

export type NovelSceneResultJson = {
  version: 1;
  reportPath?: string;
  stats: {
    sceneCount: number;
    invalidCount: number;
    errors: number;
    warns: number;
    infos: number;
    durationMs: number;
  };
  findings: SceneFinding[];
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
