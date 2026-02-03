import { tool, type ToolDefinition } from "@opencode-ai/plugin"
import type { NovelConfig } from "../../config/schema"

export function createNovelScanTool(deps: { projectRoot: string; config: NovelConfig }): ToolDefinition {
  return tool({
    description:
      "Scan novel project (skeleton). This will be expanded to parse manuscript frontmatter and build a stable snapshot.",
    args: {
      rootDir: tool.schema.string().optional(),
    },
    async execute(args) {
      return [
        "## Summary",
        `- status: not-implemented`,
        `- rootDir: ${args.rootDir ?? deps.projectRoot}`,
        `- manuscriptDir: ${deps.config.manuscriptDir}`,
        "",
        "## Result (JSON)",
        "```json",
        JSON.stringify(
          {
            version: 1,
            rootDir: args.rootDir ?? deps.projectRoot,
            manuscriptDir: deps.config.manuscriptDir,
            diagnostics: [
              {
                severity: "info",
                code: "NOT_IMPLEMENTED",
                message: "novel_scan is not implemented yet.",
              },
            ],
          },
          null,
          2,
        ),
        "```",
        "",
        "## Diagnostics",
        "- info NOT_IMPLEMENTED: novel_scan is not implemented yet.",
        "",
      ].join("\n")
    },
  })
}
