export type NovelCoreAgentBaseName = "novel" | "muse" | "editor" | "sentinel";

export type NovelExpertAgentBaseName =
  | "oracle"
  | "entity-extractor"
  | "character-expert"
  | "faction-relations"
  | "worldbible-keeper"
  | "timeline-keeper"
  | "continuity-sentinel"
  | "foreshadowing-unresolved"
  | "flaw-finder"
  | "continuation-expert"
  | "polish-expert"
  | "summary-expert";

export type NovelAgentBaseName = NovelCoreAgentBaseName | NovelExpertAgentBaseName;
