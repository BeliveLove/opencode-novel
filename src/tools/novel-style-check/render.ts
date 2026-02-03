import type { StyleFinding } from "./types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

export function renderStyleReportMd(options: {
  findings: StyleFinding[];
  stats: { warns: number; infos: number };
}): string {
  const lines: string[] = [DERIVED_HEADER, "", "# STYLE REPORT", ""];

  lines.push("## Summary", "");
  lines.push(`- warns: ${options.stats.warns}`);
  lines.push(`- infos: ${options.stats.infos}`);
  lines.push("");

  lines.push("## Findings", "");
  for (const f of options.findings) {
    const ev = f.evidence[0];
    lines.push(
      `- **${f.severity} ${f.code}**: ${f.message} (${ev.file}${ev.line ? `:${ev.line}` : ""})`,
    );
    if (f.suggestedFix) {
      lines.push(`  - fix: ${f.suggestedFix}`);
    }
    if (ev.excerpt) {
      lines.push(`  - excerpt: ${ev.excerpt}`);
    }
  }
  lines.push("");
  return lines.join("\n");
}
