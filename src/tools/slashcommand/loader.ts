import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import type { BuiltinCommandName } from "../../features/builtin-commands";
import { loadBuiltinCommands } from "../../features/builtin-commands";
import { parseFrontmatter } from "../../shared/markdown/frontmatter";
import type { CommandInfo, CommandScope } from "./types";

function isMarkdownFile(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".md");
}

function discoverCommandsFromDir(dir: string, scope: CommandScope): CommandInfo[] {
  if (!existsSync(dir)) return [];
  const entries = readdirSync(dir, { withFileTypes: true });
  const commands: CommandInfo[] = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isMarkdownFile(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    const name = entry.name.replace(/\.md$/i, "");
    const content = readFileSync(fullPath, "utf8");
    const parsed = parseFrontmatter<Record<string, unknown>>(content, {
      file: fullPath,
      strict: false,
    });
    const description =
      typeof parsed.data.description === "string" ? parsed.data.description : undefined;
    const argumentHint =
      typeof parsed.data["argument-hint"] === "string"
        ? (parsed.data["argument-hint"] as string)
        : undefined;
    const agent = typeof parsed.data.agent === "string" ? parsed.data.agent : undefined;
    const model = typeof parsed.data.model === "string" ? parsed.data.model : undefined;
    const subtask = Boolean(parsed.data.subtask);

    commands.push({
      name,
      scope,
      path: fullPath,
      metadata: { description, argumentHint, agent, model, subtask },
      content: content,
    });
  }
  return commands;
}

export function discoverAllCommands(options: {
  projectRoot: string;
  disabledCommands?: string[];
}): CommandInfo[] {
  const disabled = new Set((options.disabledCommands ?? []).map((c) => c.toLowerCase()));

  const builtin = loadBuiltinCommands(options.disabledCommands as BuiltinCommandName[] | undefined);
  const builtinCommands: CommandInfo[] = Object.values(builtin).map((c) => ({
    name: c.name,
    scope: "builtin",
    metadata: {
      description: c.description,
      argumentHint: c.argumentHint,
      agent: c.agent,
      model: c.model,
      subtask: c.subtask,
    },
    content: c.template,
  }));

  const projectDir = path.join(options.projectRoot, ".opencode", "command");
  const userDir = path.join(homedir(), ".config", "opencode", "command");

  const projectCommands = discoverCommandsFromDir(projectDir, "project");
  const userCommands = discoverCommandsFromDir(userDir, "user");

  const map = new Map<string, CommandInfo>();
  for (const cmd of builtinCommands) map.set(cmd.name.toLowerCase(), cmd);
  for (const cmd of projectCommands) map.set(cmd.name.toLowerCase(), cmd);
  for (const cmd of userCommands) map.set(cmd.name.toLowerCase(), cmd);

  const merged = Array.from(map.values()).filter((c) => !disabled.has(c.name.toLowerCase()));
  merged.sort((a, b) => a.name.localeCompare(b.name));
  return merged;
}
