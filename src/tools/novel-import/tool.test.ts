import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

  it("auto-decodes GBK/UTF-16 inputs when importing .txt", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      const gbkAbs = path.join(rootDir, "drafts", "gbk.txt");
      mkdirSync(path.dirname(gbkAbs), { recursive: true });
      const zhBytes = Buffer.from([0xd6, 0xd0, 0xce, 0xc4]); // "中文" in GBK
      const gbkBuf = Buffer.concat([
        Buffer.from("# Chapter 1: Start\n\n", "ascii"),
        zhBytes,
        Buffer.from("\n\n# Chapter 2: End\n\n", "ascii"),
        zhBytes,
        Buffer.from("\n", "ascii"),
      ]);
      writeFileSync(gbkAbs, gbkBuf);

      const utf16Abs = path.join(rootDir, "drafts", "utf16le.txt");
      const utf16Content = "# Chapter 3: UTF16\n\n中文\n";
      const utf16Buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(utf16Content, "utf16le")]);
      writeFileSync(utf16Abs, utf16Buf);

      const tool = createNovelImportTool({ projectRoot: rootDir, config });
      await executeTool(tool, { rootDir, fromDir: rootDir, mode: "copy" } satisfies NovelImportArgs);

      const out1 = readFileSync(path.join(rootDir, "manuscript", "chapters", "ch0001.md"), "utf8");
      expect(out1).toContain("中文");
      const outUtf16 = readFileSync(path.join(rootDir, "manuscript", "chapters", "ch0003.md"), "utf8");
      expect(outUtf16).toContain("中文");
    });
  });
});
