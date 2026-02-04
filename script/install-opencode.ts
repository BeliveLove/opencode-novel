#!/usr/bin/env bun
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadBuiltinCommands } from "../src/features/builtin-commands/commands";
import { loadBuiltinSkills } from "../src/features/builtin-skills/skills";
import { writeTextFile } from "../src/shared/fs/write";

type InstallTarget = "global" | "project";

type Options = {
  target: InstallTarget;
  projectRoot?: string;
  force: boolean;
  agentsPreset: "core" | "full";
  disableCompatTools: boolean;
};

function parseArgs(argv: string[]): Options {
  const options: Options = {
    target: "global",
    force: false,
    agentsPreset: "full",
    disableCompatTools: true,
  };

  for (const arg of argv) {
    if (arg === "--force") options.force = true;
    else if (arg === "--target=global") options.target = "global";
    else if (arg === "--target=project") options.target = "project";
    else if (arg.startsWith("--project-root="))
      options.projectRoot = arg.slice("--project-root=".length);
    else if (arg === "--agents=core") options.agentsPreset = "core";
    else if (arg === "--agents=full") options.agentsPreset = "full";
    else if (arg === "--compat-tools=on") options.disableCompatTools = false;
    else if (arg === "--compat-tools=off") options.disableCompatTools = true;
    else if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    } else if (arg.trim().length > 0) {
      console.warn(`[install-opencode] ignored arg: ${arg}`);
    }
  }

  if (options.target === "project" && !options.projectRoot) {
    options.projectRoot = process.cwd();
  }

  return options;
}

function printHelpAndExit(): never {
  console.log(
    `
Usage:
  bun run script/install-opencode.ts -- [options]

Options:
  --target=global|project    Install to ~/.config/opencode (global) or <project>/.opencode (project). Default: global
  --project-root=<path>      Project root when --target=project (default: cwd)
  --agents=core|full         Write novel.jsonc agents preset (default: full)
  --compat-tools=on|off      Keep or disable exporting generic tools (skill/slashcommand) via novel.jsonc (default: off)
  --force                    Overwrite existing files
  -h, --help                 Show this help
`.trim(),
  );
  process.exit(0);
}

function detectGlobalOpencodeDir(): string {
  const home = homedir();
  const primary = path.join(home, ".config", "opencode");
  if (existsSync(primary)) return primary;

  const appData = process.env.APPDATA;
  if (appData) {
    const fallback = path.join(appData, "opencode");
    if (existsSync(fallback)) return fallback;
  }

  return primary;
}

function yamlQuote(value: string): string {
  // JSON string is valid YAML scalar in practice and handles escaping safely.
  return JSON.stringify(value);
}

function buildCommandMarkdown(def: {
  description?: string;
  agent?: string;
  argumentHint?: string;
  template: string;
}): string {
  const fm: string[] = ["---"];
  if (def.description) fm.push(`description: ${yamlQuote(def.description)}`);
  if (def.agent) fm.push(`agent: ${yamlQuote(def.agent)}`);
  if (def.argumentHint) fm.push(`argument-hint: ${yamlQuote(def.argumentHint)}`);
  fm.push("---", "");

  return [...fm, def.template.trimEnd(), ""].join("\n");
}

function buildSkillMarkdown(def: { name: string; description: string; template: string }): string {
  return [
    "---",
    `name: ${yamlQuote(def.name)}`,
    `description: ${yamlQuote(def.description)}`,
    "---",
    "",
    def.template.trimEnd(),
    "",
  ].join("\n");
}

function writeFileSafe(filePath: string, content: string, options: { force: boolean }): void {
  if (!options.force && existsSync(filePath)) {
    return;
  }
  writeTextFile(filePath, content, { mode: "always" });
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  const repoRoot = path.resolve(path.join(import.meta.dir, ".."));
  const distEntry = path.join(repoRoot, "dist", "index.js");
  if (!existsSync(distEntry)) {
    console.error(`[install-opencode] missing ${distEntry}. Run: bun run build`);
    process.exit(1);
  }

  const installRoot =
    options.target === "global"
      ? detectGlobalOpencodeDir()
      : path.join(path.resolve(options.projectRoot ?? process.cwd()), ".opencode");

  const pluginDir = path.join(installRoot, "plugins");
  const commandsDir = path.join(installRoot, "commands");
  const skillDir = path.join(installRoot, "skill");

  const pluginShimPath = path.join(pluginDir, "opencode-novel.js");
  const distUrl = pathToFileURL(distEntry).toString();
  const pluginShim = `export { default } from ${yamlQuote(distUrl)};\n`;

  writeFileSafe(pluginShimPath, pluginShim, options);

  const commands = loadBuiltinCommands();
  for (const def of Object.values(commands)) {
    const outPath = path.join(commandsDir, `${def.name}.md`);
    writeFileSafe(outPath, buildCommandMarkdown(def), options);
  }

  const skills = loadBuiltinSkills();
  for (const def of Object.values(skills)) {
    const outPath = path.join(skillDir, def.name, "SKILL.md");
    writeFileSafe(outPath, buildSkillMarkdown(def), options);
  }

  const novelConfigPath = path.join(installRoot, "novel.jsonc");
  if (options.force || !existsSync(novelConfigPath)) {
    const compat = options.disableCompatTools
      ? { export_slashcommand_tool: false, export_skill_tool: false, export_skill_mcp_tool: false }
      : { export_slashcommand_tool: true, export_skill_tool: true, export_skill_mcp_tool: false };
    const novelConfig = `{
  // Global defaults for opencode-novel plugin.
  "agents_preset": ${yamlQuote(options.agentsPreset)},
  "compat": ${JSON.stringify(compat, null, 2).replaceAll("\n", "\n  ")}
}\n`;
    writeTextFile(novelConfigPath, novelConfig, { mode: "always" });
  }

  console.log("[install-opencode] done");
  console.log(`- target: ${options.target}`);
  console.log(`- opencode dir: ${installRoot}`);
  console.log(`- plugin shim: ${pluginShimPath}`);
  console.log(`- commands: ${commandsDir}`);
  console.log(`- skills: ${skillDir}`);
  console.log(`- config: ${novelConfigPath}`);
}

main();
