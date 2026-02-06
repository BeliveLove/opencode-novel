import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelConfigCheckArgs = {
  rootDir?: string;
};

export type NovelConfigCheckResultJson = {
  version: 1;
  valid: boolean;
  projectRoot: string;
  sources: {
    user?: string;
    project?: string;
  };
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
