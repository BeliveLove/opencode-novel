import { Document, HeadingLevel, Packer, PageBreak, Paragraph } from "docx";
import { marked, type Token, type Tokens } from "marked";

function inlineTokensToText(tokens: Token[] | undefined): string {
  if (!tokens) return "";
  const out: string[] = [];

  for (const token of tokens) {
    if (token.type === "text" || token.type === "escape") {
      out.push((token as Tokens.Text | Tokens.Escape).text);
      continue;
    }

    if (token.type === "codespan") {
      out.push((token as Tokens.Codespan).text);
      continue;
    }

    if (token.type === "br") {
      out.push("\n");
      continue;
    }

    if (token.type === "strong" || token.type === "em" || token.type === "del") {
      out.push(inlineTokensToText((token as Tokens.Strong | Tokens.Em | Tokens.Del).tokens));
      continue;
    }

    if (token.type === "link") {
      const link = token as Tokens.Link;
      out.push(inlineTokensToText(link.tokens) || link.href);
      continue;
    }

    if (token.type === "image") {
      const image = token as Tokens.Image;
      out.push(image.text);
      continue;
    }

    if (Array.isArray((token as Tokens.Generic).tokens)) {
      out.push(inlineTokensToText((token as Tokens.Generic).tokens));
    }
  }

  return out.join("");
}

function tokenToParagraphs(token: Token): Paragraph[] {
  if (token.type === "space") return [];

  if (token.type === "heading") {
    const heading = token as Tokens.Heading;
    const level =
      heading.depth === 1
        ? HeadingLevel.HEADING_1
        : heading.depth === 2
          ? HeadingLevel.HEADING_2
          : heading.depth === 3
            ? HeadingLevel.HEADING_3
            : heading.depth === 4
              ? HeadingLevel.HEADING_4
              : heading.depth === 5
                ? HeadingLevel.HEADING_5
                : HeadingLevel.HEADING_6;
    return [
      new Paragraph({ text: inlineTokensToText(heading.tokens) || heading.text, heading: level }),
    ];
  }

  if (token.type === "paragraph") {
    const paragraph = token as Tokens.Paragraph;
    const text = inlineTokensToText(paragraph.tokens) || paragraph.text;
    if (text.trim().length === 0) return [];
    return [new Paragraph({ text })];
  }

  if (token.type === "text") {
    const t = token as Tokens.Text;
    if (t.text.trim().length === 0) return [];
    return [new Paragraph({ text: t.text })];
  }

  if (token.type === "code") {
    const code = token as Tokens.Code;
    const lines = code.text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    return lines.map((line) => new Paragraph({ text: line }));
  }

  if (token.type === "hr") {
    return [new Paragraph({ children: [new PageBreak()] })];
  }

  if (token.type === "blockquote") {
    const blockquote = token as Tokens.Blockquote;
    const text = inlineTokensToText(blockquote.tokens) || blockquote.text;
    if (text.trim().length === 0) return [];
    return [new Paragraph({ text })];
  }

  if (token.type === "list") {
    const list = token as Tokens.List;
    const paragraphs: Paragraph[] = [];
    for (const item of list.items) {
      const text = inlineTokensToText(item.tokens) || item.text;
      if (text.trim().length === 0) continue;
      paragraphs.push(
        new Paragraph({
          text,
          bullet: { level: 0 },
        }),
      );
    }
    return paragraphs;
  }

  return [];
}

export async function markdownToDocxBytes(
  markdown: string,
  options: { title: string },
): Promise<Uint8Array> {
  const tokens = marked.lexer(markdown) as unknown as Token[];

  const children: Paragraph[] = [
    new Paragraph({ text: options.title, heading: HeadingLevel.TITLE }),
    ...tokens.flatMap(tokenToParagraphs),
  ];

  const doc = new Document({
    title: options.title,
    creator: "opencode-novel",
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}
