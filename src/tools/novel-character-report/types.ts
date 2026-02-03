import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelCharacterReportArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  writeReport?: boolean;
};

export type CharacterReportItem = {
  id: string;
  path: string;
  appearances: number;
  first_seen?: string;
  last_seen?: string;
  threads_involved: string[];
  arc_summary?: string;
  missingFields?: string[];
};

export type NovelCharacterReportResultJson = {
  version: 1;
  reportPath?: string;
  characters: CharacterReportItem[];
  diagnostics: Diagnostic[];
};
