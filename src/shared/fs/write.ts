import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { createSha256Hex } from "../hashing/sha256";

export type WriteResult = { changed: boolean };

export function ensureDirForFile(filePath: string): void {
  mkdirSync(dirname(filePath), { recursive: true });
}

export function normalizeLf(text: string): string {
  return text.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function writeTextFile(
  filePath: string,
  content: string,
  options?: { mode?: "always" | "if-changed" },
): WriteResult {
  const normalized = normalizeLf(content);
  ensureDirForFile(filePath);

  const mode = options?.mode ?? "always";
  if (mode === "if-changed") {
    try {
      const existing = readFileSync(filePath, "utf8");
      if (createSha256Hex(existing) === createSha256Hex(normalized)) {
        return { changed: false };
      }
    } catch {
      // ignore - treat as not existing
    }
  }

  writeFileSync(filePath, normalized, "utf8");
  return { changed: true };
}
