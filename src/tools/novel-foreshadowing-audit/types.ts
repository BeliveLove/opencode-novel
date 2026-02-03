import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelForeshadowingArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  writeReport?: boolean;
  strictMode?: boolean;
};

export type ThreadAuditItem = {
  thread_id: string;
  type?: string;
  status?: string;
  opened_in?: string;
  expected_close_by?: string;
  closed_in?: string | null;
  issues: { severity: "error" | "warn" | "info"; code: string; message: string }[];
  suggestedNextStep?: string;
};

export type NovelForeshadowingResultJson = {
  version: 1;
  reportPath?: string;
  stats: {
    open: number;
    in_progress: number;
    closed: number;
    abandoned: number;
    durationMs: number;
  };
  items: ThreadAuditItem[];
  diagnostics: Diagnostic[];
};
