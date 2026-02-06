export type BuiltinCommandName =
  | "novel-init"
  | "novel-import"
  | "novel-bootstrap"
  | "novel-style-guide"
  | "novel-bible"
  | "novel-index"
  | "novel-config-check"
  | "novel-entities-audit"
  | "novel-graph"
  | "novel-character-report"
  | "novel-outline"
  | "novel-character"
  | "novel-faction"
  | "novel-thread"
  | "novel-chapter-plan"
  | "novel-extract-entities"
  | "novel-apply-candidates"
  | "novel-chapter-draft"
  | "novel-continuation"
  | "novel-rewrite"
  | "novel-polish"
  | "novel-summary"
  | "novel-chapter-review"
  | "novel-continuity-check"
  | "novel-foreshadowing-audit"
  | "novel-style-check"
  | "novel-export"
  | "novel-snapshot";

export type CommandDefinition = {
  name: string;
  description?: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
  argumentHint?: string;
};

export type BuiltinCommands = Record<BuiltinCommandName, CommandDefinition>;
