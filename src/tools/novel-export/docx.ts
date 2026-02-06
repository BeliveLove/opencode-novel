import { Document, HeadingLevel, Packer, PageBreak, Paragraph } from "docx";
import { marked, type Token, type Tokens } from "marked";
import type { NovelDocxTemplate } from "./types";

type DocxTemplateStyle = {
  includeTitle: boolean;
  headingSpacingAfterTwip: number;
  paragraphSpacingAfterTwip: number;
  bodyFirstLineIndentTwip?: number;
  h1PageBreakBefore: boolean;
};

const DOCX_TEMPLATE_STYLE: Record<NovelDocxTemplate, DocxTemplateStyle> = {
  default: {
    includeTitle: true,
    headingSpacingAfterTwip: 160,
    paragraphSpacingAfterTwip: 120,
    h1PageBreakBefore: false,
  },
  manuscript: {
    includeTitle: true,
    headingSpacingAfterTwip: 220,
    paragraphSpacingAfterTwip: 160,
    bodyFirstLineIndentTwip: 420,
    h1PageBreakBefore: false,
  },
};

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

function tokenToParagraphs(
  token: Token,
  options: { style: DocxTemplateStyle; state: { seenH1Count: number } },
): Paragraph[] {
  if (token.type === "space") return [];

  if (token.type === "heading") {
    const heading = token as Tokens.Heading;
    const isH1 = heading.depth === 1;
    const pageBreakBefore =
      options.style.h1PageBreakBefore && isH1 && options.state.seenH1Count > 0;
    if (isH1) {
      options.state.seenH1Count += 1;
    }
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
      new Paragraph({
        text: inlineTokensToText(heading.tokens) || heading.text,
        heading: level,
        pageBreakBefore,
        spacing: { after: options.style.headingSpacingAfterTwip },
      }),
    ];
  }

  if (token.type === "paragraph") {
    const paragraph = token as Tokens.Paragraph;
    const text = inlineTokensToText(paragraph.tokens) || paragraph.text;
    if (text.trim().length === 0) return [];
    return [
      new Paragraph({
        text,
        spacing: { after: options.style.paragraphSpacingAfterTwip },
        indent: options.style.bodyFirstLineIndentTwip
          ? { firstLine: options.style.bodyFirstLineIndentTwip }
          : undefined,
      }),
    ];
  }

  if (token.type === "text") {
    const t = token as Tokens.Text;
    if (t.text.trim().length === 0) return [];
    return [
      new Paragraph({
        text: t.text,
        spacing: { after: options.style.paragraphSpacingAfterTwip },
        indent: options.style.bodyFirstLineIndentTwip
          ? { firstLine: options.style.bodyFirstLineIndentTwip }
          : undefined,
      }),
    ];
  }

  if (token.type === "code") {
    const code = token as Tokens.Code;
    const lines = code.text.split(/\r?\n/).filter((l) => l.length > 0);
    if (lines.length === 0) return [];
    return lines.map(
      (line) =>
        new Paragraph({
          text: line,
          spacing: { after: options.style.paragraphSpacingAfterTwip },
        }),
    );
  }

  if (token.type === "hr") {
    return [new Paragraph({ children: [new PageBreak()] })];
  }

  if (token.type === "blockquote") {
    const blockquote = token as Tokens.Blockquote;
    const text = inlineTokensToText(blockquote.tokens) || blockquote.text;
    if (text.trim().length === 0) return [];
    return [
      new Paragraph({
        text,
        spacing: { after: options.style.paragraphSpacingAfterTwip },
        indent: options.style.bodyFirstLineIndentTwip
          ? { firstLine: options.style.bodyFirstLineIndentTwip }
          : undefined,
      }),
    ];
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
          spacing: { after: options.style.paragraphSpacingAfterTwip },
        }),
      );
    }
    return paragraphs;
  }

  return [];
}

export async function markdownToDocxBytes(
  markdown: string,
  options: { title: string; template?: NovelDocxTemplate },
): Promise<Uint8Array> {
  const template = options.template ?? "default";
  const style = DOCX_TEMPLATE_STYLE[template];
  const tokens = marked.lexer(markdown) as unknown as Token[];
  const state = { seenH1Count: 0 };

  const children: Paragraph[] = [
    ...(style.includeTitle
      ? [
          new Paragraph({
            text: options.title,
            heading: HeadingLevel.TITLE,
            spacing: { after: style.headingSpacingAfterTwip },
          }),
        ]
      : []),
    ...tokens.flatMap((token) => tokenToParagraphs(token, { style, state })),
  ];

  const doc = new Document({
    title: options.title,
    creator: "opencode-novel",
    sections: [{ children }],
  });

  return await Packer.toBuffer(doc);
}
