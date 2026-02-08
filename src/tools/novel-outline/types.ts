import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelOutlineMode = "three_act" | "beat_sheet";

export type NovelOutlineArgs = {
  rootDir?: string;
  title: string;
  mode?: NovelOutlineMode;
  acts?: number;
  outputPath?: string;
  writeFile?: boolean;
};

export type OutlineBeat = {
  beat_id: string;
  label: string;
  goal: string;
  risk: string;
  expectedChapterSpan: string;
};

export type OutlineAct = {
  act: number;
  purpose: string;
  conflictUpgrade: string;
  beats: OutlineBeat[];
};

export type OutlineJson = {
  title: string;
  mode: NovelOutlineMode;
  generatedAt: string;
  requiredBeats: string[];
  acts: OutlineAct[];
  processChecklist: string[];
};

export type NovelOutlineResultJson = {
  version: 1;
  outlinePath?: string;
  outlineJson: OutlineJson;
  diagnostics: Diagnostic[];
};
