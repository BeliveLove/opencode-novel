import type { Plugin, ToolDefinition } from "@opencode-ai/plugin";
import { loadNovelConfig } from "./config/load";
import { createConfigHandler } from "./plugin-handlers";
import { createNovelApplyCandidatesTool } from "./tools/novel-apply-candidates";
import { createNovelBibleTool } from "./tools/novel-bible";
import { createNovelCharacterReportTool } from "./tools/novel-character-report";
import { createNovelContextPackTool } from "./tools/novel-context-pack";
import { createNovelContinuityCheckTool } from "./tools/novel-continuity-check";
import { createNovelEntityGapsTool } from "./tools/novel-entity-gaps";
import { createNovelExportTool } from "./tools/novel-export";
import { createNovelForeshadowingAuditTool } from "./tools/novel-foreshadowing-audit";
import { createNovelGraphTool } from "./tools/novel-graph";
import { createNovelImportTool } from "./tools/novel-import";
import { createNovelIndexTool } from "./tools/novel-index";
import { createNovelScaffoldTool } from "./tools/novel-scaffold";
import { createNovelScanTool } from "./tools/novel-scan";
import { createNovelStyleCheckTool } from "./tools/novel-style-check";
import { createSkillTool } from "./tools/skill";
import { createSlashcommandTool } from "./tools/slashcommand";

const NovelPlugin: Plugin = async (ctx) => {
  const { config, errors } = loadNovelConfig(ctx.directory);
  if (errors.length > 0) {
    for (const error of errors) {
      const location = error.path ? ` (${error.path})` : "";
      console.warn(`[opencode-novel] config error [${error.source}]${location}: ${error.message}`);
    }
  }

  const tools: Record<string, ToolDefinition> = {
    novel_scan: createNovelScanTool({ projectRoot: ctx.directory, config }),
    novel_scaffold: createNovelScaffoldTool({ projectRoot: ctx.directory, config }),
    novel_index: createNovelIndexTool({ projectRoot: ctx.directory, config }),
    novel_import: createNovelImportTool({ projectRoot: ctx.directory, config }),
    novel_bible: createNovelBibleTool({ projectRoot: ctx.directory, config }),
    novel_entity_gaps: createNovelEntityGapsTool({ projectRoot: ctx.directory, config }),
    novel_graph: createNovelGraphTool({ projectRoot: ctx.directory, config }),
    novel_character_report: createNovelCharacterReportTool({ projectRoot: ctx.directory, config }),
    novel_context_pack: createNovelContextPackTool({ projectRoot: ctx.directory, config }),
    novel_export: createNovelExportTool({ projectRoot: ctx.directory, config }),
    novel_style_check: createNovelStyleCheckTool({ projectRoot: ctx.directory, config }),
    novel_foreshadowing_audit: createNovelForeshadowingAuditTool({
      projectRoot: ctx.directory,
      config,
    }),
    novel_apply_candidates: createNovelApplyCandidatesTool({ projectRoot: ctx.directory, config }),
    novel_continuity_check: createNovelContinuityCheckTool({ projectRoot: ctx.directory, config }),
  };

  const compat = config.compat;
  const extendedTools: Record<string, ToolDefinition> = {
    ...tools,
    ...(compat.export_skill_tool
      ? {
          skill: createSkillTool({
            projectRoot: ctx.directory,
            disabledSkills: config.disabled_skills,
          }),
        }
      : {}),
    ...(compat.export_slashcommand_tool
      ? {
          slashcommand: createSlashcommandTool({
            projectRoot: ctx.directory,
            disabledCommands: config.disabled_commands,
            disabledSkills: config.disabled_skills,
          }),
        }
      : {}),
  };

  const configHandler = createConfigHandler({ pluginConfig: config });

  return { tool: extendedTools, config: configHandler };
};

export default NovelPlugin;

// NOTE: Do NOT export runtime functions from main index.ts!
// OpenCode treats ALL runtime exports as plugin instances and calls them.
