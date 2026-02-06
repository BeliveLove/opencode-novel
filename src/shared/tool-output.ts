import type { Diagnostic } from "./errors/diagnostics";
import {
  formatDiagnosticsMarkdown,
  inferReproFromDiagnosticCode,
  sortDiagnostics,
} from "./errors/diagnostics";

function normalizeResultJsonSchemaVersion(resultJson: unknown): unknown {
  if (!resultJson || typeof resultJson !== "object" || Array.isArray(resultJson)) {
    return resultJson;
  }

  const record = resultJson as Record<string, unknown>;
  if (record.schemaVersion !== undefined) {
    return resultJson;
  }

  if (typeof record.version !== "number") {
    return resultJson;
  }

  return { ...record, schemaVersion: record.version };
}

function inferNextSteps(resultJson: unknown, diagnostics: Diagnostic[]): string[] {
  if (resultJson && typeof resultJson === "object") {
    const maybe = resultJson as { nextSteps?: unknown };
    if (Array.isArray(maybe.nextSteps) && maybe.nextSteps.every((x) => typeof x === "string")) {
      return maybe.nextSteps;
    }
  }

  const nextSteps: string[] = [];
  const seen = new Set<string>();

  for (const d of sortDiagnostics(diagnostics)) {
    if (d.severity === "info") continue;
    const repro = (d.repro ?? inferReproFromDiagnosticCode(d.code))?.trim();
    if (!repro) continue;
    if (seen.has(repro)) continue;
    seen.add(repro);
    nextSteps.push(repro);
  }

  return nextSteps;
}

export function formatToolMarkdownOutput(options: {
  summaryLines: string[];
  resultJson: unknown;
  diagnostics: Diagnostic[];
}): string {
  const normalizedResultJson = normalizeResultJsonSchemaVersion(options.resultJson);
  const nextSteps = inferNextSteps(normalizedResultJson, options.diagnostics);
  return [
    "## Summary",
    ...options.summaryLines.map((l) => (l.startsWith("- ") ? l : `- ${l}`)),
    "",
    "## Result (JSON)",
    "```json",
    JSON.stringify(normalizedResultJson, null, 2),
    "```",
    "",
    "## Diagnostics",
    formatDiagnosticsMarkdown(options.diagnostics),
    "",
    "## Next Steps",
    ...(nextSteps.length > 0
      ? nextSteps.map((s) => (s.startsWith("- ") ? s : `- ${s}`))
      : ["- (none)"]),
    "",
  ].join("\n");
}
