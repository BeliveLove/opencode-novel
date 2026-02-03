import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelImportTool } from "./tool";
import type { NovelImportArgs, NovelImportResultJson } from "./types";

describe("novel_import", () => {
  it("splits multi-chapter markdown into manuscript/chapters", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "drafts/book.md",
        `# 第1章 起风

内容A

# 第2章 结尾

内容B
`,
      );

      const tool = createNovelImportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        fromDir: rootDir,
        mode: "copy",
      } satisfies NovelImportArgs);
      const json = extractResultJson(String(output)) as NovelImportResultJson;

      expect(json.version).toBe(1);
      expect(json.writtenChapters.length).toBeGreaterThanOrEqual(2);
      expect(existsSync(path.join(rootDir, "manuscript", "chapters"))).toBeTrue();
      expect(
        readFileSync(path.join(rootDir, ".opencode", "novel", "IMPORT_REPORT.md"), "utf8"),
      ).toContain("# IMPORT REPORT");
    });
  });
});
