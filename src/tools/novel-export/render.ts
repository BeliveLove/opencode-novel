import { marked } from "marked"

export function wrapHtmlDocument(options: { title: string; bodyHtml: string; language?: string }): string {
  const lang = options.language ?? "zh"
  const css = `
body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Apple Color Emoji","Segoe UI Emoji";margin:0;padding:0;background:#fff;color:#111;}
main{max-width:860px;margin:0 auto;padding:40px 20px;}
article{line-height:1.75;font-size:16px;}
article h1,article h2,article h3{line-height:1.25;}
article hr{border:none;border-top:1px solid #ddd;margin:32px 0;}
article pre{background:#f6f8fa;padding:12px 14px;overflow:auto;border-radius:8px;}
article code{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;}
`
    .trim()

  return [
    "<!doctype html>",
    `<html lang="${lang}">`,
    "<head>",
    '  <meta charset="utf-8" />',
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />',
    `  <title>${escapeHtml(options.title)}</title>`,
    `  <style>${css}</style>`,
    "</head>",
    "<body>",
    "  <main>",
    "    <article>",
    options.bodyHtml,
    "    </article>",
    "  </main>",
    "</body>",
    "</html>",
    "",
  ].join("\n")
}

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function markdownToHtml(markdown: string): string {
  return marked.parse(markdown) as string
}

