import type { Diagnostic } from "./errors/diagnostics";
import { formatDiagnosticsMarkdown } from "./errors/diagnostics";

export function formatToolMarkdownOutput(options: {
  summaryLines: string[];
  resultJson: unknown;
  diagnostics: Diagnostic[];
}): string {
  return [
    "## Summary",
    ...options.summaryLines.map((l) => (l.startsWith("- ") ? l : `- ${l}`)),
    "",
    "## Result (JSON)",
    "```json",
    JSON.stringify(options.resultJson, null, 2),
    "```",
    "",
    "## Diagnostics",
    formatDiagnosticsMarkdown(options.diagnostics),
    "",
  ].join("\n");
}
