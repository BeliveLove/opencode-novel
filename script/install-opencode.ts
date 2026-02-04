#!/usr/bin/env bun
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { applyEdits, modify, type ParseError, parse } from "jsonc-parser";
import { loadBuiltinCommands } from "../src/features/builtin-commands/commands";
import { loadBuiltinSkills } from "../src/features/builtin-skills/skills";
import { writeTextFile } from "../src/shared/fs/write";
import { buildCommandMarkdown, buildSkillMarkdown, yamlQuote } from "../src/shared/opencode/artifacts";

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
    agentsPreset: "core",
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
  --agents=core|full         Write novel.jsonc agents preset (default: core)
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

function detectOpencodeConfigPath(opencodeDir: string): string {
  const jsonc = path.join(opencodeDir, "opencode.jsonc");
  const json = path.join(opencodeDir, "opencode.json");
  if (existsSync(jsonc)) return jsonc;
  if (existsSync(json)) return json;
  return json;
}

function parseJsoncObject(raw: string): { data: Record<string, unknown> | null; errors: string[] } {
  const errors: string[] = [];
  const parseErrors: ParseError[] = [];
  const parsed = parse(raw, parseErrors) as unknown;

  if (parseErrors.length > 0) {
    errors.push(
      ...parseErrors.map(
        (e) => `JSONC parse error: code=${e.error} offset=${e.offset} length=${e.length}`,
      ),
    );
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    errors.push("Config root must be a JSON object.");
    return { data: null, errors };
  }

  return { data: parsed as Record<string, unknown>, errors };
}

function upsertOpencodePlugin(opencodeConfigPath: string, pluginSpecifier: string): void {
  let raw = "";
  try {
    raw = existsSync(opencodeConfigPath) ? readFileSync(opencodeConfigPath, "utf8") : "";
  } catch {
    raw = "";
  }

  if (raw.trim().length === 0) {
    raw = `{\n  "$schema": "https://opencode.ai/config.json"\n}\n`;
  }

  const parsed = parseJsoncObject(raw);
  if (!parsed.data) {
    console.warn(
      `[install-opencode] failed to parse ${opencodeConfigPath}; will only upsert 'plugin' field.`,
    );
  }

  const current = parsed.data?.plugin;
  const currentPlugins: string[] =
    typeof current === "string"
      ? [current]
      : Array.isArray(current)
        ? current.filter((v): v is string => typeof v === "string")
        : [];
  const nextPlugins = currentPlugins.includes(pluginSpecifier)
    ? currentPlugins
    : [...currentPlugins, pluginSpecifier];

  const edits = modify(raw, ["plugin"], nextPlugins, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
  });
  const updated = applyEdits(raw, edits);
  writeTextFile(opencodeConfigPath, updated, { mode: "always" });
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

  const pluginShimUrl = pathToFileURL(pluginShimPath).toString();
  const opencodeConfigPath = detectOpencodeConfigPath(installRoot);
  upsertOpencodePlugin(opencodeConfigPath, pluginShimUrl);

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
  "agents_primary": ["sentinel"],
  "compat": ${JSON.stringify(compat, null, 2).replaceAll("\n", "\n  ")}
}\n`;
    writeTextFile(novelConfigPath, novelConfig, { mode: "always" });
  }

  console.log("[install-opencode] done");
  console.log(`- target: ${options.target}`);
  console.log(`- opencode dir: ${installRoot}`);
  console.log(`- plugin shim: ${pluginShimPath}`);
  console.log(`- opencode config: ${opencodeConfigPath}`);
  console.log(`- commands: ${commandsDir}`);
  console.log(`- skills: ${skillDir}`);
  console.log(`- config: ${novelConfigPath}`);
}

main();
