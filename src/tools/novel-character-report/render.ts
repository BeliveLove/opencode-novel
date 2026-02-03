import type { CharacterReportItem } from "./types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

function mdEscape(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ").trim();
}

export function renderCharacterReportMd(items: CharacterReportItem[]): string {
  const lines: string[] = [DERIVED_HEADER, "", "# CHARACTER REPORT", ""];

  lines.push(
    "| id | appearances | first_seen | last_seen | threads_involved | arc_summary | missing_fields | path |",
  );
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const item of items) {
    lines.push(
      `| ${mdEscape(item.id)} | ${item.appearances} | ${mdEscape(item.first_seen ?? "")} | ${mdEscape(item.last_seen ?? "")} | ${mdEscape(item.threads_involved.join(", "))} | ${mdEscape(item.arc_summary ?? "")} | ${mdEscape((item.missingFields ?? []).join(", "))} | ${mdEscape(item.path)} |`,
    );
  }
  lines.push("");
  return lines.join("\n");
}
