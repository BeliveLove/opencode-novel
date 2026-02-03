import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelExportTool } from "./tool";
import type { NovelExportArgs, NovelExportResultJson } from "./types";

describe("novel_export", () => {
  it("exports DOCX and writes a .docx file", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

# 第一章：起风

正文段落 A。
`,
      );

      const tool = createNovelExportTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        format: "docx",
        outputDir: "export",
        title: "测试书",
        includeFrontmatter: false,
        writeFile: true,
      } satisfies NovelExportArgs);

      const json = extractResultJson(String(output)) as NovelExportResultJson;

      expect(json.version).toBe(1);
      expect(json.format).toBe("docx");
      expect(json.outputPath).toBeTruthy();
      expect(json.outputPath).toContain("export/");
      expect(json.outputPath).toEndWith(".docx");

      const abs = path.join(rootDir, String(json.outputPath).replaceAll("/", path.sep));
      expect(existsSync(abs)).toBeTrue();
      const bytes = readFileSync(abs);
      expect(bytes.length).toBeGreaterThan(100);
      expect(bytes[0]).toBe(0x50); // P
      expect(bytes[1]).toBe(0x4b); // K
    });
  });
});
