import type { ChapterEntity, CharacterEntity, ThreadEntity } from "../novel-scan/types";

const DERIVED_HEADER = "<!-- novel:derived v1; DO NOT EDIT BY HAND -->";

function mdEscapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ").trim();
}

function renderTable(headers: string[], rows: string[][]): string {
  const headerLine = `| ${headers.map(mdEscapeCell).join(" | ")} |`;
  const sepLine = `| ${headers.map(() => "---").join(" | ")} |`;
  const bodyLines = rows.map((r) => `| ${r.map((c) => mdEscapeCell(c)).join(" | ")} |`);
  return [headerLine, sepLine, ...bodyLines].join("\n");
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) return "";
  return values.join(", ");
}

export function renderIndexMd(options: {
  chapters: ChapterEntity[];
  characters: CharacterEntity[];
  threads: Array<
    ThreadEntity & { opened_in?: string; expected_close_by?: string; closed_in?: string | null }
  >;
  factions: Array<{ id: string; name?: string; appearances: number }>;
  locations: Array<{ id: string; name?: string; appearances: number }>;
  characterAppearances: Map<string, { count: number; first?: string; last?: string }>;
}): string {
  const chapterRows = options.chapters.map((c) => [
    c.chapter_id,
    c.title ?? "",
    c.pov ?? "",
    c.timeline?.date ?? "",
    c.timeline?.location ?? "",
    formatList(c.characters),
    formatList(c.threads_opened),
    formatList(c.threads_closed),
  ]);

  const characterRows = options.characters.map((c) => {
    const stats = options.characterAppearances.get(c.id);
    return [
      c.id,
      c.name ?? "",
      formatList(c.alias),
      stats?.first ?? "",
      stats?.last ?? "",
      String(stats?.count ?? 0),
    ];
  });

  const threadRows = options.threads.map((t) => [
    t.thread_id,
    t.type ?? "",
    t.status ?? "",
    t.opened_in ?? "",
    t.expected_close_by ?? "",
    t.closed_in ?? "",
  ]);

  const factionRows = options.factions.map((f) => [f.id, f.name ?? "", String(f.appearances)]);

  const locationRows = options.locations.map((l) => [l.id, l.name ?? "", String(l.appearances)]);

  return [
    DERIVED_HEADER,
    "",
    "# INDEX",
    "",
    "## Chapters",
    "",
    renderTable(
      [
        "chapter_id",
        "title",
        "pov",
        "date",
        "location",
        "characters",
        "threads_opened",
        "threads_closed",
      ],
      chapterRows,
    ),
    "",
    "## Characters",
    "",
    renderTable(["id", "name", "aliases", "first_seen", "last_seen", "appearances"], characterRows),
    "",
    "## Threads",
    "",
    renderTable(
      ["thread_id", "type", "status", "opened_in", "expected_close_by", "closed_in"],
      threadRows,
    ),
    "",
    "## Factions",
    "",
    renderTable(["id", "name", "appearances"], factionRows),
    "",
    "## Locations",
    "",
    renderTable(["id", "name", "appearances"], locationRows),
    "",
  ].join("\n");
}

export function renderTimelineMd(options: { chapters: ChapterEntity[] }): string {
  const rows = options.chapters.map((c) => [
    c.chapter_id,
    c.timeline?.date ?? "",
    c.timeline?.start ?? "",
    c.timeline?.end ?? "",
    c.timeline?.location ?? "",
    c.title ?? "",
    c.summary ?? "",
  ]);
  return [
    DERIVED_HEADER,
    "",
    "# TIMELINE",
    "",
    renderTable(["chapter_id", "date", "start", "end", "location", "title", "summary"], rows),
    "",
  ].join("\n");
}

export function renderThreadsReportMd(options: {
  threads: Array<
    ThreadEntity & { opened_in?: string; expected_close_by?: string; closed_in?: string | null }
  >;
}): string {
  const rows = options.threads.map((t) => [
    t.thread_id,
    t.type ?? "",
    t.status ?? "",
    t.opened_in ?? "",
    t.expected_close_by ?? "",
    t.closed_in ?? "",
  ]);
  return [
    DERIVED_HEADER,
    "",
    "# THREADS REPORT",
    "",
    renderTable(
      ["thread_id", "type", "status", "opened_in", "expected_close_by", "closed_in"],
      rows,
    ),
    "",
  ].join("\n");
}
