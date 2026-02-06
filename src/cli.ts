#!/usr/bin/env bun
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { applyEdits, modify, type ParseError, parse } from "jsonc-parser";
import { loadBuiltinCommands } from "./features/builtin-commands/commands";
import { getBuiltinSkillInstallFiles, loadBuiltinSkills } from "./features/builtin-skills";
import { normalizeLf, writeTextFile } from "./shared/fs/write";
import { buildCommandMarkdown, yamlQuote } from "./shared/opencode/artifacts";

type InstallTarget = "global" | "project";

type InstallOptions = {
  target: InstallTarget;
  projectRoot?: string;
  force: boolean;
  agentsPreset: "core" | "full";
  disableCompatTools: boolean;
};

type UninstallOptions = {
  target: InstallTarget;
  projectRoot?: string;
  dryRun: boolean;
  force: boolean;
  removeConfig: boolean;
};

function printRootHelpAndExit(): never {
  console.log(
    `
opencode-novel CLI

Usage:
  opencode-novel <command> [options]

Commands:
  install     Install plugin + commands + skills into OpenCode config
  uninstall   Remove installed files from OpenCode config

Help:
  opencode-novel install --help
  opencode-novel uninstall --help
`.trim(),
  );
  process.exit(0);
}

function printInstallHelpAndExit(): never {
  console.log(
    `
Usage:
  opencode-novel install [options]

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

function printUninstallHelpAndExit(): never {
  console.log(
    `
Usage:
  opencode-novel uninstall [options]

Options:
  --target=global|project    Uninstall from ~/.config/opencode (global) or <project>/.opencode (project). Default: global
  --project-root=<path>      Project root when --target=project (default: cwd)
  --dry-run                  Print planned removals without changing files
  --force                    Remove files even if they appear modified
  --remove-config            Remove novel.jsonc (default)
  --keep-config              Keep novel.jsonc
  -h, --help                 Show this help
`.trim(),
  );
  process.exit(0);
}

function parseInstallArgs(argv: string[]): InstallOptions {
  const options: InstallOptions = {
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
    else if (arg === "--help" || arg === "-h") printInstallHelpAndExit();
    else if (arg.trim().length > 0) {
      console.warn(`[opencode-novel] ignored arg: ${arg}`);
    }
  }

  if (options.target === "project" && !options.projectRoot) {
    options.projectRoot = process.cwd();
  }

  return options;
}

function parseUninstallArgs(argv: string[]): UninstallOptions {
  const options: UninstallOptions = {
    target: "global",
    dryRun: false,
    force: false,
    removeConfig: true,
  };

  for (const arg of argv) {
    if (arg === "--dry-run") options.dryRun = true;
    else if (arg === "--force") options.force = true;
    else if (arg === "--remove-config") options.removeConfig = true;
    else if (arg === "--keep-config") options.removeConfig = false;
    else if (arg === "--target=global") options.target = "global";
    else if (arg === "--target=project") options.target = "project";
    else if (arg.startsWith("--project-root="))
      options.projectRoot = arg.slice("--project-root=".length);
    else if (arg === "--help" || arg === "-h") printUninstallHelpAndExit();
    else if (arg.trim().length > 0) {
      console.warn(`[opencode-novel] ignored arg: ${arg}`);
    }
  }

  if (options.target === "project" && !options.projectRoot) {
    options.projectRoot = process.cwd();
  }

  return options;
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
      `[opencode-novel] failed to parse ${opencodeConfigPath}; will only upsert 'plugin' field.`,
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

function upsertOpencodePluginRemoval(options: {
  opencodeConfigPath: string;
  pluginSpecifier: string;
  dryRun: boolean;
}): { removed: boolean; skipped: boolean; reason?: string } {
  let raw = "";
  try {
    raw = existsSync(options.opencodeConfigPath)
      ? readFileSync(options.opencodeConfigPath, "utf8")
      : "";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: `read failed: ${message}` };
  }

  if (raw.trim().length === 0) {
    return { removed: false, skipped: true, reason: "config file is empty/missing" };
  }

  const parsed = parseJsoncObject(raw);
  if (!parsed.data) {
    return { removed: false, skipped: true, reason: "config parse failed (JSONC)" };
  }

  const current = parsed.data.plugin;
  const currentPlugins: string[] =
    typeof current === "string"
      ? [current]
      : Array.isArray(current)
        ? current.filter((v) => typeof v === "string")
        : [];

  const nextPlugins = currentPlugins.filter((p) => p !== options.pluginSpecifier);
  if (nextPlugins.length === currentPlugins.length) {
    return { removed: false, skipped: true, reason: "plugin not found in config" };
  }

  const edits = modify(raw, ["plugin"], nextPlugins.length > 0 ? nextPlugins : undefined, {
    formattingOptions: { insertSpaces: true, tabSize: 2, eol: "\n" },
  });
  const updated = applyEdits(raw, edits);

  if (!options.dryRun) {
    try {
      writeTextFile(options.opencodeConfigPath, updated, { mode: "always" });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { removed: false, skipped: true, reason: `write failed: ${message}` };
    }
  }

  return { removed: true, skipped: false };
}

function writeFileSafe(filePath: string, content: string, options: { force: boolean }): void {
  if (!options.force && existsSync(filePath)) {
    return;
  }
  writeTextFile(filePath, content, { mode: "always" });
}

function removeFileSafe(
  filePath: string,
  options: { dryRun: boolean },
): { removed: boolean; skipped: boolean; reason?: string } {
  if (!existsSync(filePath)) return { removed: false, skipped: true, reason: "missing" };
  if (options.dryRun) return { removed: true, skipped: false };
  try {
    rmSync(filePath, { force: true });
    return { removed: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: message };
  }
}

function removeFileIfUnmodified(
  filePath: string,
  expectedContent: string,
  options: { dryRun: boolean; force: boolean },
): { removed: boolean; skipped: boolean; reason?: string } {
  if (!existsSync(filePath)) return { removed: false, skipped: true, reason: "missing" };
  if (options.force) return removeFileSafe(filePath, options);

  let current = "";
  try {
    current = readFileSync(filePath, "utf8");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: `read failed: ${message}` };
  }

  const same = normalizeLf(current).trimEnd() === normalizeLf(expectedContent).trimEnd();
  if (!same) return { removed: false, skipped: true, reason: "modified (use --force)" };

  return removeFileSafe(filePath, options);
}

function removeDirIfEmpty(
  dirPath: string,
  options: { dryRun: boolean },
): { removed: boolean; skipped: boolean; reason?: string } {
  if (!existsSync(dirPath)) return { removed: false, skipped: true, reason: "missing" };

  try {
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) return { removed: false, skipped: true, reason: "not a directory" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: message };
  }

  let entries: string[] = [];
  try {
    entries = readdirSync(dirPath);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: message };
  }

  if (entries.length > 0) return { removed: false, skipped: true, reason: "directory not empty" };
  if (options.dryRun) return { removed: true, skipped: false };

  try {
    rmSync(dirPath, { recursive: true, force: true });
    return { removed: true, skipped: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { removed: false, skipped: true, reason: message };
  }
}

function detectPackageRoot(): string {
  // Works for both `src/cli.ts` (dev) and `dist/cli.js` (published).
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(path.join(here, ".."));
}

function runInstall(argv: string[]): void {
  const options = parseInstallArgs(argv);

  const packageRoot = detectPackageRoot();
  const distEntry = path.join(packageRoot, "dist", "index.js");
  if (!existsSync(distEntry)) {
    console.error(`[opencode-novel] missing ${distEntry}. Run: bun run build`);
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
    const files = getBuiltinSkillInstallFiles(def);
    for (const file of files) {
      const outPath = path.join(skillDir, file.relativePath);
      writeFileSafe(outPath, file.content, options);
    }
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

  console.log("[opencode-novel] install done");
  console.log(`- target: ${options.target}`);
  console.log(`- opencode dir: ${installRoot}`);
  console.log(`- plugin shim: ${pluginShimPath}`);
  console.log(`- opencode config: ${opencodeConfigPath}`);
  console.log(`- commands: ${commandsDir}`);
  console.log(`- skills: ${skillDir}`);
  console.log(`- config: ${novelConfigPath}`);
}

function runUninstall(argv: string[]): void {
  const options = parseUninstallArgs(argv);

  const installRoot =
    options.target === "global"
      ? detectGlobalOpencodeDir()
      : path.join(path.resolve(options.projectRoot ?? process.cwd()), ".opencode");

  const pluginDir = path.join(installRoot, "plugins");
  const commandsDir = path.join(installRoot, "commands");
  const skillDir = path.join(installRoot, "skill");

  const pluginShimPath = path.join(pluginDir, "opencode-novel.js");
  const pluginShimUrl = pathToFileURL(pluginShimPath).toString();

  const opencodeConfigPath = detectOpencodeConfigPath(installRoot);
  const pluginConfigResult = upsertOpencodePluginRemoval({
    opencodeConfigPath,
    pluginSpecifier: pluginShimUrl,
    dryRun: options.dryRun,
  });

  const removedPluginShim = removeFileSafe(pluginShimPath, options);

  const removedCommands: string[] = [];
  const skippedCommands: Array<{ path: string; reason: string }> = [];
  const commands = loadBuiltinCommands();
  for (const def of Object.values(commands)) {
    const outPath = path.join(commandsDir, `${def.name}.md`);
    const expected = buildCommandMarkdown(def);
    const result = removeFileIfUnmodified(outPath, expected, options);
    if (result.removed && !result.skipped) removedCommands.push(outPath);
    else skippedCommands.push({ path: outPath, reason: result.reason ?? "skipped" });
  }

  const removedSkills: string[] = [];
  const skippedSkills: Array<{ path: string; reason: string }> = [];
  const skills = loadBuiltinSkills();
  for (const def of Object.values(skills)) {
    const installFiles = getBuiltinSkillInstallFiles(def);
    const dirsToCleanup = new Set<string>([path.join(skillDir, def.name)]);
    for (const installFile of installFiles) {
      const outPath = path.join(skillDir, installFile.relativePath);
      dirsToCleanup.add(path.dirname(outPath));
      const result = removeFileIfUnmodified(outPath, installFile.content, options);
      if (result.removed && !result.skipped) removedSkills.push(outPath);
      else skippedSkills.push({ path: outPath, reason: result.reason ?? "skipped" });
    }
    const sortedDirs = Array.from(dirsToCleanup).sort((a, b) => b.length - a.length);
    for (const dir of sortedDirs) {
      removeDirIfEmpty(dir, options);
    }
  }

  const novelConfigPath = path.join(installRoot, "novel.jsonc");
  const removedNovelConfig = options.removeConfig
    ? removeFileSafe(novelConfigPath, options)
    : { removed: false, skipped: true, reason: "keep-config" };

  console.log("[opencode-novel] uninstall done");
  console.log(`- target: ${options.target}`);
  console.log(`- opencode dir: ${installRoot}`);
  console.log(`- opencode config: ${opencodeConfigPath}`);
  console.log(`- removed plugin shim: ${removedPluginShim.removed && !removedPluginShim.skipped}`);
  console.log(`- removed plugin from config: ${pluginConfigResult.removed}`);
  console.log(`- removed commands: ${removedCommands.length}`);
  console.log(`- removed skills: ${removedSkills.length}`);
  console.log(
    `- removed novel.jsonc: ${removedNovelConfig.removed && !removedNovelConfig.skipped}`,
  );

  if (skippedCommands.length > 0) {
    console.log(`- skipped commands: ${skippedCommands.length} (use --force to delete)`);
  }
  if (skippedSkills.length > 0) {
    console.log(`- skipped skills: ${skippedSkills.length} (use --force to delete)`);
  }
}

function main(): void {
  const [command, ...rest] = process.argv.slice(2);
  if (!command) printRootHelpAndExit();

  if (command === "install") runInstall(rest);
  else if (command === "uninstall") runUninstall(rest);
  else if (command === "help" || command === "--help" || command === "-h") printRootHelpAndExit();
  else {
    console.error(`[opencode-novel] unknown command: ${command}`);
    printRootHelpAndExit();
  }
}

main();
