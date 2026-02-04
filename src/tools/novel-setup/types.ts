import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelSetupArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  bookTitle?: string;
  writeTemplates?: boolean;
  forceOverwriteTemplates?: boolean;
  exportCommands?: boolean;
  exportSkills?: boolean;
  forceOverwriteCommands?: boolean;
  forceOverwriteSkills?: boolean;
  writeConfigJsonc?: boolean;
};

export type NovelSetupResultJson = {
  version: 1;
  manuscriptDir: string;
  configPath?: string;
  createdDirs: string[];
  writtenFiles: string[];
  skippedExisting: string[];
  commands: {
    dir: string;
    written: string[];
    skipped: string[];
  };
  skills: {
    dir: string;
    written: string[];
    skipped: string[];
  };
  stats: {
    durationMs: number;
  };
  diagnostics: Diagnostic[];
};

