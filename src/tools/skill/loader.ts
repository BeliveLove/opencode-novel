import { existsSync, readdirSync, readFileSync } from "node:fs"
import { homedir } from "node:os"
import path from "node:path"
import { parseFrontmatter } from "../../shared/markdown/frontmatter"
import { loadBuiltinSkills } from "../../features/builtin-skills"
import type { BuiltinSkillName } from "../../features/builtin-skills"
import type { LoadedSkill, SkillScope } from "./types"

function extractSkillInstruction(template: string): string {
  const match = template.match(/<skill-instruction>([\s\S]*?)<\/skill-instruction>/)
  return match ? match[1].trim() : template.trim()
}

function isMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".md")
}

function discoverSkillsFromDir(dir: string, scope: SkillScope): LoadedSkill[] {
  if (!existsSync(dir)) return []
  const entries = readdirSync(dir, { withFileTypes: true })
  const skills: LoadedSkill[] = []

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(dir, entry.name, "SKILL.md")
      if (!existsSync(skillPath)) continue
      const content = readFileSync(skillPath, "utf8")
      const parsed = parseFrontmatter<Record<string, unknown>>(content, { file: skillPath, strict: false })
      const name = (typeof parsed.data.name === "string" ? parsed.data.name : entry.name).trim()
      const description = typeof parsed.data.description === "string" ? parsed.data.description : undefined
      const argumentHint = typeof parsed.data.argumentHint === "string" ? parsed.data.argumentHint : undefined
      const agent = typeof parsed.data.agent === "string" ? parsed.data.agent : undefined
      skills.push({
        name,
        scope,
        path: skillPath,
        definition: {
          description,
          argumentHint,
          agent,
          template: extractSkillInstruction(content),
        },
      })
      continue
    }

    if (entry.isFile() && isMarkdownFile(entry.name)) {
      const skillPath = path.join(dir, entry.name)
      const content = readFileSync(skillPath, "utf8")
      const parsed = parseFrontmatter<Record<string, unknown>>(content, { file: skillPath, strict: false })
      const fileNameBase = entry.name.replace(/\.md$/i, "")
      const name = (typeof parsed.data.name === "string" ? parsed.data.name : fileNameBase).trim()
      const description = typeof parsed.data.description === "string" ? parsed.data.description : undefined
      const argumentHint = typeof parsed.data.argumentHint === "string" ? parsed.data.argumentHint : undefined
      const agent = typeof parsed.data.agent === "string" ? parsed.data.agent : undefined
      skills.push({
        name,
        scope,
        path: skillPath,
        definition: {
          description,
          argumentHint,
          agent,
          template: extractSkillInstruction(content),
        },
      })
    }
  }

  return skills
}

export function discoverAllSkills(options: {
  projectRoot: string
  disabledSkills?: string[]
}): LoadedSkill[] {
  const disabled = new Set((options.disabledSkills ?? []).map((s) => s.toLowerCase()))

  const builtin = loadBuiltinSkills(options.disabledSkills as BuiltinSkillName[] | undefined)
  const builtinSkills: LoadedSkill[] = Object.values(builtin).map((s) => ({
    name: s.name,
    scope: "builtin",
    definition: {
      description: s.description,
      argumentHint: s.argumentHint,
      agent: s.agent,
      model: s.model,
      subtask: s.subtask,
      template: extractSkillInstruction(s.template),
    },
  }))

  const projectSkillsDir = path.join(options.projectRoot, ".opencode", "skills")
  const userSkillsDir = path.join(homedir(), ".config", "opencode", "skills")
  const projectSkills = discoverSkillsFromDir(projectSkillsDir, "project")
  const userSkills = discoverSkillsFromDir(userSkillsDir, "user")

  // Merge strategy: project overrides builtin; user overrides project (last wins)
  const map = new Map<string, LoadedSkill>()
  for (const s of builtinSkills) map.set(s.name.toLowerCase(), s)
  for (const s of projectSkills) map.set(s.name.toLowerCase(), s)
  for (const s of userSkills) map.set(s.name.toLowerCase(), s)

  const merged = Array.from(map.values()).filter((s) => !disabled.has(s.name.toLowerCase()))
  merged.sort((a, b) => a.name.localeCompare(b.name))
  return merged
}
