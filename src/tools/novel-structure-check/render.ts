import type { StructureFinding } from "./types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

export function renderStructureReportMd(options: {
  stats: {
    coverage: number;
    requiredBeats: number;
    seenRequiredBeats: number;
    missing: number;
    orderErrors: number;
    errors: number;
    warns: number;
    infos: number;
  };
  findings: StructureFinding[];
}): string {
  const lines: string[] = [DERIVED_HEADER, "", "# STRUCTURE REPORT", ""];

  lines.push("## Summary", "");
  lines.push(`- coverage: ${options.stats.coverage.toFixed(4)}`);
  lines.push(`- requiredBeats: ${options.stats.requiredBeats}`);
  lines.push(`- seenRequiredBeats: ${options.stats.seenRequiredBeats}`);
  lines.push(`- missing: ${options.stats.missing}`);
  lines.push(`- orderErrors: ${options.stats.orderErrors}`);
  lines.push(`- errors: ${options.stats.errors}`);
  lines.push(`- warns: ${options.stats.warns}`);
  lines.push(`- infos: ${options.stats.infos}`);
  lines.push("");

  lines.push("## Findings", "");
  if (options.findings.length === 0) {
    lines.push("- (none)");
  } else {
    for (const finding of options.findings) {
      const ev = finding.evidence[0];
      const loc = `${ev.file}${ev.line ? `:${ev.line}` : ""}`;
      lines.push(`- **${finding.severity} ${finding.code}**: ${finding.message} (${loc})`);
      if (finding.suggestedFix) {
        lines.push(`  - fix_hint: ${finding.suggestedFix}`);
      }
      if (finding.repro) {
        lines.push(`  - repro: ${finding.repro}`);
      }
      if (ev.excerpt) {
        lines.push(`  - excerpt: ${ev.excerpt}`);
      }
    }
  }
  lines.push("");
  return lines.join("\n");
}
