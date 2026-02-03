import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelIndexArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  writeDerivedFiles?: boolean;
  forceWrite?: boolean;
};

export type NovelIndexResultJson = {
  version: 1;
  outputDir: string;
  writtenFiles: string[];
  skippedFiles: string[];
  stats: { chapters: number; characters: number; threads: number; durationMs: number };
  diagnostics: Diagnostic[];
};
