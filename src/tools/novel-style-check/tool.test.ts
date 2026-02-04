import { describe, expect, it } from "bun:test";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelStyleCheckTool } from "./tool";
import type { NovelStyleResultJson } from "./types";

describe("novel_style_check", () => {
  it("reports avoid-words and catchphrase stats", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        styleGuide: { lexicon: { avoid: ["坏词"] } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
characters: [char-zhangsan]
threads_opened: []
threads_advanced: []
threads_closed: []
---

# 第一章：起风

这里有一个坏词。
`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---
id: char-zhangsan
name: "张三"
voice:
  catchphrases: ["从不出现"]
---
`,
      );

      const tool = createNovelStyleCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, writeReport: false });
      const json = extractResultJson(String(output)) as NovelStyleResultJson;

      expect(json.stats.warns).toBeGreaterThan(0);
      expect(json.stats.infos).toBeGreaterThan(0);
      expect(json.findings.some((f) => f.code === "STYLE_AVOID_WORD")).toBeTrue();
      expect(json.findings.some((f) => f.code === "STYLE_CATCHPHRASE_STATS")).toBeTrue();
    });
  });
});

