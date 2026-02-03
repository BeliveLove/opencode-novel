export type SkillScope = "builtin" | "project" | "user"

export type LoadedSkill = {
  name: string
  scope: SkillScope
  path?: string
  definition: {
    description?: string
    argumentHint?: string
    agent?: string
    model?: string
    subtask?: boolean
    template: string
  }
}

