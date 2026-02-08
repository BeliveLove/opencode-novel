import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelChapterPlanArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  chapter_id: string;
  structureRef?: string;
  outputPath?: string;
  writeFile?: boolean;
  sceneCount?: number;
};

export type ChapterPlanScene = {
  scene_id: string;
  objective: string;
  conflict: string;
  outcome: string;
  hook?: string;
};

export type ChapterPlanJson = {
  chapter_id: string;
  title?: string;
  structureRef?: string;
  sourceChapterPath?: string;
  sceneBlueprint: ChapterPlanScene[];
  writingChecklist: string[];
  qualityGates: string[];
};

export type NovelChapterPlanResultJson = {
  version: 1;
  planPath?: string;
  planJson: ChapterPlanJson;
  diagnostics: Diagnostic[];
};
