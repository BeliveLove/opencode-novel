export const TEXT_ENCODINGS = [
  "auto",
  "utf8",
  "utf8-bom",
  "utf16le",
  "utf16be",
  "gbk",
  "gb18030",
] as const;

export type TextEncoding = (typeof TEXT_ENCODINGS)[number];
