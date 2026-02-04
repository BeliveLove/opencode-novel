import type { Diagnostic } from "../../shared/errors/diagnostics";
import type { TextEncoding } from "../../shared/strings/text-encoding";

export type NovelImportMode = "copy" | "analyze";

export type NovelImportArgs = {
  rootDir?: string;
  fromDir?: string;
  mode?: NovelImportMode;
  manuscriptDir?: string;
  encoding?: TextEncoding;
  includeGlobs?: string[];
  excludeGlobs?: string[];
  writeConfigJsonc?: boolean;
  writeReport?: boolean;
};

export type ImportMapItem = {
  chapter_id: string;
  title?: string;
  source_path: string;
  source_type: "md" | "txt";
  source_heading_line: number;
  source_range: { startLine: number; endLine: number };
  output_path: string;
  warnings?: string[];
};

export type NovelImportResultJson = {
  version: 1;
  mode: NovelImportMode;
  fromDir: string;
  manuscriptDir: string;
  writtenChapters: string[];
  conflicts: { chapter_id: string; existing: string; written: string }[];
  unclassified: { source_path: string; reason: string }[];
  reportPath?: string;
  importMapPath?: string;
  diagnostics: Diagnostic[];
};
