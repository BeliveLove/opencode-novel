import type { BibleRule, GlossaryTerm } from "./types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

export function renderBibleSummaryMd(rules: BibleRule[]): string {
  const lines: string[] = [DERIVED_HEADER, "", "# BIBLE SUMMARY", ""];
  lines.push("## Rules", "");
  for (const rule of rules) {
    lines.push(
      `- **${rule.id}**: ${rule.text} (${rule.sourceFile}${rule.line ? `:${rule.line}` : ""})`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

export function renderGlossaryMd(terms: GlossaryTerm[]): string {
  const lines: string[] = [DERIVED_HEADER, "", "# GLOSSARY", ""];
  for (const term of terms) {
    const def = term.definition ? `：${term.definition}` : "";
    lines.push(`- **${term.term}**${def} (${term.sourceFile})`);
  }
  lines.push("");
  return lines.join("\n");
}
