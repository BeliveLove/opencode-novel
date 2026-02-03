import type { Diagnostic } from "../../shared/errors/diagnostics";

export type NovelGraphKind = "relationships" | "factions";

export type NovelGraphArgs = {
  rootDir?: string;
  manuscriptDir?: string;
  outputDir?: string;
  kind: NovelGraphKind;
  writeFile?: boolean;
  preferExplicitRelations?: boolean;
  cooccurrenceMinWeight?: number;
};

export type NovelGraphResultJson = {
  version: 1;
  kind: NovelGraphKind;
  graphPath?: string;
  stats: { nodes: number; edges: number };
  diagnostics: Diagnostic[];
};
