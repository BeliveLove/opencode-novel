import type { ThreadAuditItem } from "./types"

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->"

function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ").trim()
}

export function renderForeshadowingAuditMd(options: { items: ThreadAuditItem[]; stats: Record<string, number> }): string {
  const lines: string[] = [DERIVED_HEADER, "", "# FORESHADOWING AUDIT", ""]

  lines.push("## Summary", "")
  for (const [key, value] of Object.entries(options.stats)) {
    lines.push(`- ${key}: ${value}`)
  }
  lines.push("")

  lines.push("## Threads", "")
  lines.push("| thread_id | status | opened_in | expected_close_by | closed_in | issues | next_step |")
  lines.push("| --- | --- | --- | --- | --- | --- | --- |")
  for (const item of options.items) {
    const issues = item.issues.map((i) => `${i.severity}:${i.code}`).join(", ")
    lines.push(
      `| ${escapeCell(item.thread_id)} | ${escapeCell(item.status ?? "")} | ${escapeCell(item.opened_in ?? "")} | ${escapeCell(item.expected_close_by ?? "")} | ${escapeCell(item.closed_in ?? "")} | ${escapeCell(issues)} | ${escapeCell(item.suggestedNextStep ?? "")} |`,
    )
  }
  lines.push("")

  return lines.join("\n")
}

