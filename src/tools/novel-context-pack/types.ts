import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelContextPackTask = "draft" | "review" | "rewrite" | "continuity" | "foreshadowing";

export type NovelContextPackArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  task: NovelContextPackTask;
  chapter_id?: string;
  thread_id?: string;
  budget?: { maxChars: number };
  include?: { bible?: boolean; characters?: boolean; openThreads?: boolean; lastChapters?: number };
  redaction?: { enabled: boolean; patterns: string[] };
  writeFile?: boolean;
};

export type NovelContextPackResultJson = {
  version: 1;
  packPath?: string;
  included: { path: string; reason: string; chars: number }[];
  stats: { totalChars: number; budgetChars: number };
  diagnostics: Diagnostic[];
};
