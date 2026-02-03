import { tool, type ToolDefinition } from "@opencode-ai/plugin"

export function createNovelScanTool(): ToolDefinition {
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
        `- rootDir: ${args.rootDir ?? "(default)"}`,
        "",
        "## Result (JSON)",
        "```json",
        JSON.stringify(
          {
            version: 1,
            rootDir: args.rootDir ?? null,
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

