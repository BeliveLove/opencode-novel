import { createHash } from "node:crypto";
import { normalizeLf } from "../fs/write";

export function createSha256Hex(content: string): string {
  const normalized = normalizeLf(content);
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function createSha256HexFromBytes(content: Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}
