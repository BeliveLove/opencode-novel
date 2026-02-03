export type CommandScope = "builtin" | "project" | "user";

export type CommandInfo = {
  name: string;
  scope: CommandScope;
  path?: string;
  metadata: {
    description?: string;
    argumentHint?: string;
    agent?: string;
    model?: string;
    subtask?: boolean;
  };
  content: string;
};
