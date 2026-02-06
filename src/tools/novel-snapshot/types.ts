import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelSnapshotArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  tag?: string;
  includeBible?: boolean;
  includeDerived?: boolean;
};

export type NovelSnapshotEntry = {
  source: string;
  dest: string;
};

export type NovelSnapshotResultJson = {
  version: 1;
  tag: string;
  snapshotDir: string;
  entries: NovelSnapshotEntry[];
  savedFiles: string[];
  stats: { durationMs: number; savedFiles: number };
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
