import type { MissingEntityRef, OrphanEntity } from "./types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

export function renderEntityGapsMd(options: {
  missing: MissingEntityRef[];
  orphans: OrphanEntity[];
}): string {
  const lines: string[] = [DERIVED_HEADER, "", "# ENTITY GAPS", ""];

  lines.push("## Missing (Referenced but Undefined)", "");
  for (const m of options.missing) {
    lines.push(`- **${m.kind}** \`${m.id}\` → ${m.suggestedPath}`);
    lines.push(
      `  - fix_hint: 创建该实体文件（或运行 /novel-entities-audit --stubs 自动生成 stub）。`,
    );
    lines.push("  - repro: /novel-entities-audit");
    for (const ref of m.referencedBy) {
      lines.push(`  - referencedBy: ${ref.chapter_id} (${ref.path})`);
    }
  }
  lines.push("");

  lines.push("## Orphans (Defined but Never Referenced)", "");
  for (const o of options.orphans) {
    lines.push(`- **${o.kind}** \`${o.id}\` (${o.path})`);
    lines.push(
      "  - fix_hint: 若确实无用可删除；否则在章节 frontmatter 中补充引用（characters/factions/locations/threads_*）。",
    );
    lines.push("  - repro: /novel-entities-audit");
  }
  lines.push("");

  return lines.join("\n");
}
