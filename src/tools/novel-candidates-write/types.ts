import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelCandidatesWriteArgs = {
  rootDir?: string;
  candidatesPath?: string;
  candidates: unknown;
};

export type NovelCandidatesWriteResultJson = {
  version: 1;
  candidatesPath?: string;
  changed?: boolean;
  ops?: number;
  diagnostics: Diagnostic[];
};
