import type { ContinuityFinding } from "./types"

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->"

export function renderContinuityReportMd(options: {
  stats: { errors: number; warns: number; infos: number }
  findings: ContinuityFinding[]
}): string {
  const lines: string[] = [DERIVED_HEADER, "", "# CONTINUITY REPORT", ""]

  lines.push("## Summary", "")
  lines.push(`- errors: ${options.stats.errors}`)
  lines.push(`- warns: ${options.stats.warns}`)
  lines.push(`- infos: ${options.stats.infos}`)
  lines.push("")

  lines.push("## Findings", "")
  for (const f of options.findings) {
    const ev = f.evidence[0]
    const loc = `${ev.file}${ev.line ? `:${ev.line}` : ""}`
    lines.push(`- **${f.severity} ${f.ruleId}**: ${f.message} (${loc})`)
    if (f.suggestedFix) {
      lines.push(`  - suggestedFix: ${f.suggestedFix}`)
    }
    if (ev.excerpt) {
      lines.push(`  - excerpt: ${ev.excerpt}`)
    }
  }
  lines.push("")
  return lines.join("\n")
}

