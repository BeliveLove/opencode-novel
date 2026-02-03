import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelScaffoldArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  bookTitle?: string;
  writeConfigJsonc?: boolean;
  writeTemplates?: boolean;
  forceOverwriteTemplates?: boolean;
};

export type NovelScaffoldResultJson = {
  version: 1;
  manuscriptDir: string;
  createdDirs: string[];
  writtenFiles: string[];
  skippedExisting: string[];
  configPath?: string;
  diagnostics: Diagnostic[];
};
