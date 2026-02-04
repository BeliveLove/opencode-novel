import type { Diagnostic } from "../../shared/errors/diagnostics";
import type { NovelCharacterReportResultJson } from "../novel-character-report/types";
import type { NovelEntityGapsResultJson } from "../novel-entity-gaps/types";
import type { NovelGraphResultJson } from "../novel-graph/types";
import type { NovelImportMode, NovelImportResultJson } from "../novel-import/types";
import type { NovelIndexResultJson } from "../novel-index/types";
import type { NovelScaffoldResultJson } from "../novel-scaffold/types";

export type NovelBootstrapArgs = {
  rootDir?: string;
  fromDir?: string;
  manuscriptDir?: string;
  bookTitle?: string;
  importMode?: NovelImportMode;
  createStubs?: boolean;
};

export type NovelBootstrapResultJson = {
  version: 1;
  rootDir: string;
  fromDir: string;
  manuscriptDir: string;
  results: {
    scaffold: NovelScaffoldResultJson;
    import: NovelImportResultJson;
    index: NovelIndexResultJson;
    entityGaps: NovelEntityGapsResultJson;
    graphs: {
      relationships: NovelGraphResultJson;
      factions: NovelGraphResultJson;
    };
    characterReport: NovelCharacterReportResultJson;
  };
  writtenFiles: string[];
  nextSteps: string[];
  diagnostics: Diagnostic[];
  stats: { durationMs: number };
};
