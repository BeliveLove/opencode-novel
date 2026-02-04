import { readFileSync } from "node:fs";
import type { TextEncoding } from "../strings/text-encoding";

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16LE_BOM = [0xff, 0xfe] as const;
const UTF16BE_BOM = [0xfe, 0xff] as const;

type LooseTextDecoderConstructor = new (
  label?: string,
  options?: { fatal?: boolean; ignoreBOM?: boolean },
) => TextDecoder;

function startsWithBytes(buf: Uint8Array, bytes: readonly number[]): boolean {
  if (buf.length < bytes.length) return false;
  for (let i = 0; i < bytes.length; i += 1) {
    if (buf[i] !== bytes[i]) return false;
  }
  return true;
}

function stripBom(buf: Uint8Array): {
  buf: Uint8Array;
  bom: "utf8" | "utf16le" | "utf16be" | null;
} {
  if (startsWithBytes(buf, UTF8_BOM)) return { buf: buf.slice(UTF8_BOM.length), bom: "utf8" };
  if (startsWithBytes(buf, UTF16LE_BOM))
    return { buf: buf.slice(UTF16LE_BOM.length), bom: "utf16le" };
  if (startsWithBytes(buf, UTF16BE_BOM))
    return { buf: buf.slice(UTF16BE_BOM.length), bom: "utf16be" };
  return { buf, bom: null };
}

function decodeWithLabel(buf: Uint8Array, label: string): string {
  // Bun supports additional encodings (e.g. gbk/gb18030) that are not in Node's TS types.
  const Decoder = TextDecoder as unknown as LooseTextDecoderConstructor;
  return new Decoder(label).decode(buf);
}

function isValidUtf8(buf: Uint8Array): boolean {
  try {
    // In Bun, invalid sequences throw TypeError when fatal=true.
    new TextDecoder("utf-8", { fatal: true }).decode(buf);
    return true;
  } catch {
    return false;
  }
}

export function decodeText(buf: Uint8Array, encoding: TextEncoding): string {
  if (buf.length === 0) return "";

  if (encoding === "auto") {
    const stripped = stripBom(buf);
    if (stripped.bom === "utf8") return decodeWithLabel(stripped.buf, "utf-8");
    if (stripped.bom === "utf16le") return decodeWithLabel(stripped.buf, "utf-16le");
    if (stripped.bom === "utf16be") return decodeWithLabel(stripped.buf, "utf-16be");

    if (isValidUtf8(buf)) {
      return decodeWithLabel(buf, "utf-8");
    }
    return decodeWithLabel(buf, "gb18030");
  }

  const stripped = stripBom(buf);
  if (encoding === "utf8" || encoding === "utf8-bom") return decodeWithLabel(stripped.buf, "utf-8");
  if (encoding === "utf16le") return decodeWithLabel(stripped.buf, "utf-16le");
  if (encoding === "utf16be") return decodeWithLabel(stripped.buf, "utf-16be");
  if (encoding === "gbk") return decodeWithLabel(stripped.buf, "gbk");
  return decodeWithLabel(stripped.buf, "gb18030");
}

export function readTextFileSync(filePath: string, options?: { encoding?: TextEncoding }): string {
  const encoding = options?.encoding ?? "auto";
  const buf = readFileSync(filePath);
  return decodeText(buf, encoding);
}
