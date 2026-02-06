import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelIndexArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  writeDerivedFiles?: boolean;
  forceWrite?: boolean;
  scanMode?: "full" | "incremental";
  writeCache?: boolean;
};

export type NovelIndexResultJson = {
  version: 1;
  generatedAt: string;
  scanScope: {
    manuscriptDir: string;
    mode: "full" | "incremental";
  };
  outputDir: string;
  writtenFiles: string[];
  skippedFiles: string[];
  stats: {
    chapters: number;
    characters: number;
    threads: number;
    durationMs: number;
    scan: {
      filesScanned: number;
      durationMs: number;
      cache: {
        mode: "full" | "incremental";
        loaded: boolean;
        written: boolean;
        fastHits: number;
        hashHits: number;
        misses: number;
      };
    };
  };
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};
