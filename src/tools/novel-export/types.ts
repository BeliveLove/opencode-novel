import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelExportFormat = "md" | "html" | "epub" | "docx";
export type NovelChapterOrder = "by_id" | "by_timeline" | "custom";
export type NovelDocxTemplate = "default" | "manuscript";

export type NovelExportPreflightCheck =
  | "index"
  | "continuity"
  | "foreshadowing"
  | "style"
  | "structure"
  | "scene"
  | "arc"
  | "pacing";
export type NovelExportPreflightFailOn = "error" | "warn";

export type NovelExportArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  format?: NovelExportFormat;
  outputDir?: string;
  title?: string;
  chapterOrder?: NovelChapterOrder;
  customOrder?: string[];
  includeFrontmatter?: boolean;
  writeFile?: boolean;
  docxTemplate?: NovelDocxTemplate;
  preflight?: boolean;
  preflightChecks?: NovelExportPreflightCheck[];
  preflightFailOn?: NovelExportPreflightFailOn;
};

export type NovelExportPreflightSummary = {
  enabled: boolean;
  blocked: boolean;
  checks: NovelExportPreflightCheck[];
  failOn: NovelExportPreflightFailOn;
  stats: { errors: number; warns: number; infos: number };
  reports: {
    indexOutputDir?: string;
    continuityReportPath?: string;
    foreshadowingReportPath?: string;
    styleReportPath?: string;
    structureReportPath?: string;
    sceneReportPath?: string;
    arcReportPath?: string;
    pacingReportPath?: string;
  };
};

export type NovelExportManifest = {
  version: 1;
  title: string;
  formats: NovelExportFormat[];
  chapterOrder: NovelChapterOrder;
  includeFrontmatter: boolean;
  docxTemplate?: NovelDocxTemplate;
  preflight?: {
    enabled: boolean;
    blocked: boolean;
    failOn: NovelExportPreflightFailOn;
    checks: NovelExportPreflightCheck[];
  };
  chapters: Array<{
    chapter_id: string;
    path: string;
    title?: string;
    contentSha256: string;
  }>;
  outputs: Array<{
    format: NovelExportFormat;
    outputPath: string;
    contentSha256: string;
  }>;
};

export type NovelExportResultJsonV1 = {
  version: 1;
  format: NovelExportFormat;
  outputPath?: string;
  manifestPath?: string;
  docxTemplate?: NovelDocxTemplate;
  chapters: { chapter_id: string; title?: string; path: string }[];
  stats: { chapters: number; durationMs: number };
  preflight?: NovelExportPreflightSummary;
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};

export type NovelExportResultJsonV2 = {
  version: 2;
  formats: NovelExportFormat[];
  outputs: { format: NovelExportFormat; outputPath?: string }[];
  manifestPath?: string;
  docxTemplate?: NovelDocxTemplate;
  chapters: { chapter_id: string; title?: string; path: string }[];
  stats: { chapters: number; durationMs: number };
  preflight?: NovelExportPreflightSummary;
  nextSteps?: string[];
  diagnostics: Diagnostic[];
};

export type NovelExportResultJson = NovelExportResultJsonV1 | NovelExportResultJsonV2;
