import type { Plugin, ToolDefinition } from "@opencode-ai/plugin"
import { createNovelScanTool } from "./tools/novel-scan"

const NovelPlugin: Plugin = async (_ctx) => {
  const tools: Record<string, ToolDefinition> = {
    novel_scan: createNovelScanTool(),
  }

  return { tool: tools }
}

export default NovelPlugin

// NOTE: Do NOT export runtime functions from main index.ts!
// OpenCode treats ALL runtime exports as plugin instances and calls them.

