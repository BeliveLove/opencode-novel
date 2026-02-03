import type { NovelApplyCandidatesResultJson } from "./types"

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->"

export function renderApplyReportMd(result: NovelApplyCandidatesResultJson): string {
  const lines: string[] = [DERIVED_HEADER, "", "# APPLY REPORT", ""]

  lines.push("## Summary", "")
  lines.push(`- dryRun: ${result.dryRun}`)
  lines.push(`- appliedOps: ${result.appliedOps}`)
  lines.push(`- writtenFiles: ${result.writtenFiles.length}`)
  lines.push(`- skippedOps: ${result.skippedOps.length}`)
  lines.push("")

  lines.push("## Written Files", "")
  for (const f of result.writtenFiles) {
    lines.push(`- ${f}`)
  }
  lines.push("")

  lines.push("## Skipped Ops", "")
  for (const s of result.skippedOps) {
    lines.push(`- #${s.index}: ${s.reason}`)
  }
  lines.push("")

  return lines.join("\n")
}

