import { createHash } from "node:crypto";
import { strToU8, type Zippable, zipSync } from "fflate";

export type EpubChapter = {
  id: string;
  title: string;
  bodyHtml: string;
};

export function chaptersToEpubBytes(options: {
  title: string;
  language: string;
  chapters: EpubChapter[];
}): Uint8Array {
  const title = options.title.trim() || "novel";
  const language = options.language.trim() || "zh";
  const chapters = ensureUniqueChapterFiles(
    options.chapters.map((c, index) => ({
      id: c.id.trim() || `ch${String(index + 1).padStart(4, "0")}`,
      title: c.title.trim() || c.id.trim() || `Chapter ${index + 1}`,
      bodyHtml: c.bodyHtml,
    })),
  );

  const uid = `urn:uuid:${deterministicUuidV4(
    `${title}|${language}|${chapters.map((c) => c.id).join(",")}`,
  )}`;
  const modifiedIso = new Date().toISOString().replace(/\.\d+Z$/, "Z");

  const css = buildDefaultCss();
  const navXhtml = buildNavXhtml({ title, language, chapters });
  const tocNcx = buildTocNcx({ uid, title, chapters });
  const contentOpf = buildContentOpf({ uid, title, language, modifiedIso, chapters });

  const files: Zippable = {};
  // Per spec: mimetype must be the first entry AND stored (no compression).
  files.mimetype = [strToU8("application/epub+zip"), { level: 0 }];
  files["META-INF/container.xml"] = strToU8(buildContainerXml());
  files["OEBPS/content.opf"] = strToU8(contentOpf);
  files["OEBPS/nav.xhtml"] = strToU8(navXhtml);
  files["OEBPS/toc.ncx"] = strToU8(tocNcx);
  files["OEBPS/styles.css"] = strToU8(css);

  for (const chapter of chapters) {
    files[`OEBPS/chapters/${chapter.fileName}`] = strToU8(
      buildChapterXhtml({
        title: chapter.title,
        language,
        bodyHtml: chapter.bodyHtml,
        id: chapter.id,
      }),
    );
  }

  return zipSync(files, { level: 9 });
}

type ResolvedChapter = EpubChapter & { fileName: string };

function ensureUniqueChapterFiles(chapters: EpubChapter[]): ResolvedChapter[] {
  const used = new Set<string>();
  const resolved: ResolvedChapter[] = [];

  for (const chapter of chapters) {
    const stem = slugifyFileStem(chapter.id);
    let fileName = `${stem}.xhtml`;
    if (used.has(fileName)) {
      let i = 2;
      while (used.has(`${stem}-${i}.xhtml`)) i++;
      fileName = `${stem}-${i}.xhtml`;
    }
    used.add(fileName);
    resolved.push({ ...chapter, fileName });
  }

  return resolved;
}

function buildContainerXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">',
    "  <rootfiles>",
    '    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />',
    "  </rootfiles>",
    "</container>",
    "",
  ].join("\n");
}

function buildContentOpf(options: {
  uid: string;
  title: string;
  language: string;
  modifiedIso: string;
  chapters: ResolvedChapter[];
}): string {
  const manifestItems = [
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />',
    '    <item id="style" href="styles.css" media-type="text/css" />',
    ...options.chapters.map(
      (c) =>
        `    <item id="${escapeXmlAttr(c.id)}" href="chapters/${escapeXmlAttr(c.fileName)}" media-type="application/xhtml+xml" />`,
    ),
  ];
  const spineItems = options.chapters.map((c) => `    <itemref idref="${escapeXmlAttr(c.id)}" />`);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">',
    '  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">',
    `    <dc:identifier id="pub-id">${escapeXmlText(options.uid)}</dc:identifier>`,
    `    <dc:title>${escapeXmlText(options.title)}</dc:title>`,
    `    <dc:language>${escapeXmlText(options.language)}</dc:language>`,
    `    <meta property="dcterms:modified">${escapeXmlText(options.modifiedIso)}</meta>`,
    "  </metadata>",
    "  <manifest>",
    ...manifestItems,
    "  </manifest>",
    '  <spine toc="ncx">',
    ...spineItems,
    "  </spine>",
    "</package>",
    "",
  ].join("\n");
}

function buildNavXhtml(options: {
  title: string;
  language: string;
  chapters: ResolvedChapter[];
}): string {
  const items = options.chapters.map(
    (c) =>
      `      <li><a href="chapters/${escapeXmlAttr(c.fileName)}">${escapeXmlText(c.title)}</a></li>`,
  );

  const body = [
    '  <nav epub:type="toc" id="toc">',
    `    <h1>${escapeXmlText(options.title)}</h1>`,
    "    <ol>",
    ...items,
    "    </ol>",
    "  </nav>",
  ].join("\n");

  return wrapXhtml({
    title: "Table of Contents",
    language: options.language,
    cssHref: "styles.css",
    bodyHtml: body,
  });
}

function buildTocNcx(options: { uid: string; title: string; chapters: ResolvedChapter[] }): string {
  const navPoints = options.chapters.map((c, index) => {
    const playOrder = index + 1;
    const id = `navPoint-${playOrder}`;
    return [
      `    <navPoint id="${escapeXmlAttr(id)}" playOrder="${playOrder}">`,
      `      <navLabel><text>${escapeXmlText(c.title)}</text></navLabel>`,
      `      <content src="chapters/${escapeXmlAttr(c.fileName)}" />`,
      "    </navPoint>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">',
    '<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">',
    "  <head>",
    `    <meta name="dtb:uid" content="${escapeXmlAttr(options.uid)}" />`,
    '    <meta name="dtb:depth" content="1" />',
    '    <meta name="dtb:totalPageCount" content="0" />',
    '    <meta name="dtb:maxPageNumber" content="0" />',
    "  </head>",
    `  <docTitle><text>${escapeXmlText(options.title)}</text></docTitle>`,
    "  <navMap>",
    ...navPoints,
    "  </navMap>",
    "</ncx>",
    "",
  ].join("\n");
}

function buildChapterXhtml(options: {
  id: string;
  title: string;
  language: string;
  bodyHtml: string;
}): string {
  const body = [
    `  <section epub:type="chapter" id="${escapeXmlAttr(options.id)}">`,
    toXhtmlFragment(options.bodyHtml),
    "  </section>",
  ].join("\n");

  return wrapXhtml({
    title: options.title,
    language: options.language,
    cssHref: "../styles.css",
    bodyHtml: body,
  });
}

function wrapXhtml(options: {
  title: string;
  language: string;
  cssHref?: string;
  bodyHtml: string;
}): string {
  const cssLine = options.cssHref
    ? `  <link rel="stylesheet" type="text/css" href="${escapeXmlAttr(options.cssHref)}" />`
    : "";
  const headLines = [
    '  <meta charset="utf-8" />',
    `  <title>${escapeXmlText(options.title)}</title>`,
    cssLine,
  ].filter((l) => l.length > 0);

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<!DOCTYPE html>",
    `<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="${escapeXmlAttr(
      options.language,
    )}" lang="${escapeXmlAttr(options.language)}">`,
    "<head>",
    ...headLines,
    "</head>",
    "<body>",
    options.bodyHtml,
    "</body>",
    "</html>",
    "",
  ].join("\n");
}

function buildDefaultCss(): string {
  return `
body{
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.75;
  font-size: 1em;
  color: #111;
}
h1,h2,h3{line-height:1.25;}
hr{border:none;border-top:1px solid #ddd;margin:1.5em 0;}
pre{background:#f6f8fa;padding:0.75em 0.9em;overflow:auto;border-radius:0.5em;}
code{font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;}
`.trimStart();
}

function toXhtmlFragment(html: string): string {
  // Best-effort: make common void elements XHTML-friendly.
  // This does not guarantee full XHTML validity, but works well for typical Markdown output.
  let out = html;
  out = out.replace(/<br\s*>/gi, "<br />");
  out = out.replace(/<hr\s*>/gi, "<hr />");

  out = out.replace(/<img\b[^>]*?>/gi, (m) => (m.endsWith("/>") ? m : `${m.slice(0, -1)} />`));
  out = out.replace(/<meta\b[^>]*?>/gi, (m) => (m.endsWith("/>") ? m : `${m.slice(0, -1)} />`));
  out = out.replace(/<link\b[^>]*?>/gi, (m) => (m.endsWith("/>") ? m : `${m.slice(0, -1)} />`));
  out = out.replace(/<input\b[^>]*?>/gi, (m) => (m.endsWith("/>") ? m : `${m.slice(0, -1)} />`));

  return out;
}

function escapeXmlText(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function escapeXmlAttr(text: string): string {
  return escapeXmlText(text).replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function slugifyFileStem(value: string): string {
  const safe = value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return safe.length > 0 ? safe : "chapter";
}

function deterministicUuidV4(input: string): string {
  const bytes = createHash("sha256").update(input).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20,
  )}-${hex.slice(20)}`;
}
