import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelCandidatesWriteTool } from "./tool";

describe("novel_candidates_write", () => {
  it("writes candidates.json to cache dir", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      const tool = createNovelCandidatesWriteTool({ projectRoot: rootDir, config });

      const out = (await executeTool(tool, {
        rootDir,
        candidates: {
          version: 1,
          generatedAt: "2026-02-05T00:00:00Z",
          scope: { kind: "all" },
          ops: [],
        },
      })) as string;

      const json = extractResultJson(out) as {
        version: number;
        candidatesPath?: string;
        ops?: number;
      };
      expect(json.version).toBe(1);
      expect(json.candidatesPath).toBe(".opencode/novel/cache/candidates.json");
      expect(json.ops).toBe(0);

      const abs = path.join(rootDir, ".opencode", "novel", "cache", "candidates.json");
      expect(existsSync(abs)).toBe(true);
      const content = readFileSync(abs, "utf8");
      expect(content).toContain('"version": 1');
      expect(content).toContain('"scope":');
    });
  });

  it("rejects invalid candidates", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      const tool = createNovelCandidatesWriteTool({ projectRoot: rootDir, config });

      const out = (await executeTool(tool, {
        rootDir,
        candidates: { version: 2 },
      })) as string;

      const abs = path.join(rootDir, ".opencode", "novel", "cache", "candidates.json");
      expect(existsSync(abs)).toBe(false);
      expect(out).toContain("status: failed");
    });
  });
});
