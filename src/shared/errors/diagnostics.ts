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
  repro?: string;
};

export function inferReproFromDiagnosticCode(code: string): string | undefined {
  if (code.startsWith("BOOTSTRAP_")) return "/novel-bootstrap";
  if (code.startsWith("SCAFFOLD_") || code.startsWith("SETUP_")) return "/novel-init";
  if (code.startsWith("CONFIG_")) return "/novel-config-check";
  if (code.startsWith("EXPORT_")) return "/novel-export";
  if (code.startsWith("INDEX_") || code.startsWith("SCAN_") || code === "PARSE_FRONTMATTER")
    return "/novel-index";
  if (code.startsWith("CONT_")) return "/novel-continuity-check";
  if (code.startsWith("STR_")) return "/novel-structure-check";
  if (code.startsWith("SCN_")) return "/novel-scene-check";
  if (code.startsWith("THREAD_") || code === "THREADS_DISABLED")
    return "/novel-foreshadowing-audit";
  if (code.startsWith("STYLE_")) return "/novel-style-check";
  if (code.startsWith("OUTLINE_")) return "/novel-outline";
  if (code.startsWith("PLAN_")) return "/novel-chapter-plan";
  if (code.startsWith("ENTITY_")) return "/novel-entities-audit";
  if (code.startsWith("APPLY_")) return "/novel-apply-candidates";
  if (code.startsWith("IMPORT_")) return "/novel-import";
  if (code.startsWith("GRAPH_")) return "/novel-graph";
  if (code.startsWith("BIBLE_")) return "/novel-bible";
  return undefined;
}

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
  const lines: string[] = [];
  for (const d of sorted) {
    const location = d.file ? ` (${d.file}${d.line ? `:${d.line}` : ""})` : "";
    lines.push(`- ${d.severity} ${d.code}${location}: ${d.message}`);
    if (d.suggestedFix) {
      lines.push(`  - fix_hint: ${d.suggestedFix}`);
    }
    const repro = d.repro ?? inferReproFromDiagnosticCode(d.code);
    if (repro) {
      lines.push(`  - repro: ${repro}`);
    }
  }
  return lines.join("\n");
}
