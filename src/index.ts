import type { Plugin, ToolDefinition } from "@opencode-ai/plugin"
import { loadNovelConfig } from "./config/load"
import { createNovelScanTool } from "./tools/novel-scan"

const NovelPlugin: Plugin = async (ctx) => {
  const { config, errors } = loadNovelConfig(ctx.directory)
  if (errors.length > 0) {
    for (const error of errors) {
      const location = error.path ? ` (${error.path})` : ""
      console.warn(`[opencode-novel] config error [${error.source}]${location}: ${error.message}`)
    }
  }

  const tools: Record<string, ToolDefinition> = {
    novel_scan: createNovelScanTool({ projectRoot: ctx.directory, config }),
  }

  return { tool: tools }
}

export default NovelPlugin

// NOTE: Do NOT export runtime functions from main index.ts!
// OpenCode treats ALL runtime exports as plugin instances and calls them.
