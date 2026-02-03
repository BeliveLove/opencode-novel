import type { MissingEntityRef, OrphanEntity } from "./types"

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->"

export function renderEntityGapsMd(options: {
  missing: MissingEntityRef[]
  orphans: OrphanEntity[]
}): string {
  const lines: string[] = [DERIVED_HEADER, "", "# ENTITY GAPS", ""]

  lines.push("## Missing (Referenced but Undefined)", "")
  for (const m of options.missing) {
    lines.push(`- **${m.kind}** \`${m.id}\` → ${m.suggestedPath}`)
    for (const ref of m.referencedBy) {
      lines.push(`  - referencedBy: ${ref.chapter_id} (${ref.path})`)
    }
  }
  lines.push("")

  lines.push("## Orphans (Defined but Never Referenced)", "")
  for (const o of options.orphans) {
    lines.push(`- **${o.kind}** \`${o.id}\` (${o.path})`)
  }
  lines.push("")

  return lines.join("\n")
}

