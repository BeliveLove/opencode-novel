export type BuiltinSkillName =
  | "novel-oracle"
  | "novel-entity-extractor"
  | "novel-character-expert"
  | "novel-faction-relations"
  | "novel-worldbible-keeper"
  | "novel-timeline-keeper"
  | "novel-continuity-sentinel"
  | "novel-foreshadowing-unresolved"
  | "novel-flaw-finder"
  | "novel-continuation-expert"
  | "novel-polish-expert"
  | "novel-summary-expert"
  | "taxonomy-registry"
  | "genre-classifier"
  | "trope-classifier"
  | "audience-classifier"
  | "emotion-classifier"
  | "structure-classifier"
  | "market-tagger"
  | "profile-aggregator";

export type SkillDefinition = {
  name: string;
  description: string;
  template: string;
  argumentHint?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
};

export type BuiltinSkills = Record<BuiltinSkillName, SkillDefinition>;
