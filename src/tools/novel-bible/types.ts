import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelBibleArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  writeDerivedFiles?: boolean;
};

export type BibleRule = { id: string; text: string; sourceFile: string; line?: number };
export type GlossaryTerm = { term: string; definition?: string; sourceFile: string };

export type NovelBibleResultJson = {
  version: 1;
  summaryPath?: string;
  glossaryPath?: string;
  rules: BibleRule[];
  glossary: GlossaryTerm[];
  diagnostics: Diagnostic[];
};
