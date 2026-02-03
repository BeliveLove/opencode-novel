export type DiagnosticSeverity = "error" | "warn" | "info";

export type DiagnosticEvidence = {
  file: string;
  line?: number;
  excerpt?: string;
};

export type Diagnostic = {
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  file?: string;
  line?: number;
  evidence?: DiagnosticEvidence[];
  suggestedFix?: string;
};

export function sortDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const order: Record<DiagnosticSeverity, number> = { error: 0, warn: 1, info: 2 };
  return [...diagnostics].sort((a, b) => {
    const aOrder = order[a.severity] ?? 99;
    const bOrder = order[b.severity] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    if (a.code !== b.code) return a.code.localeCompare(b.code);
    if ((a.file ?? "") !== (b.file ?? "")) return (a.file ?? "").localeCompare(b.file ?? "");
    if ((a.line ?? 0) !== (b.line ?? 0)) return (a.line ?? 0) - (b.line ?? 0);
    return a.message.localeCompare(b.message);
  });
}

export function formatDiagnosticsMarkdown(diagnostics: Diagnostic[]): string {
  if (diagnostics.length === 0) {
    return "- (none)";
  }
  const sorted = sortDiagnostics(diagnostics);
  return sorted
    .map((d) => {
      const location = d.file ? ` (${d.file}${d.line ? `:${d.line}` : ""})` : "";
      return `- ${d.severity} ${d.code}${location}: ${d.message}`;
    })
    .join("\n");
}
