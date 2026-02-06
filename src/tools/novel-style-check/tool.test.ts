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

  it("uses config threshold for catchphrase maxCount", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        styleGuide: { checks: { catchphrase: { maxCount: 1 } } },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
characters: [char-zhangsan]
---

# 第一章：起风

“常用口癖。”他叹气。
“常用口癖。”他又说了一次。`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---
id: char-zhangsan
name: "张三"
voice:
  catchphrases: ["常用口癖"]
---
`,
      );

      const tool = createNovelStyleCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, writeReport: false });
      const json = extractResultJson(String(output)) as NovelStyleResultJson;

      expect(json.findings.some((f) => f.code === "STYLE_CATCHPHRASE_STATS")).toBeTrue();
    });
  });

  it("allows disabling missing-catchphrase report via args", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
characters: [char-zhangsan]
---

# 第一章：起风

正文没有角色口癖。`,
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
      const output = await executeTool(tool, {
        rootDir,
        writeReport: false,
        catchphraseReportMissing: false,
      });
      const json = extractResultJson(String(output)) as NovelStyleResultJson;

      expect(json.findings.some((f) => f.code === "STYLE_CATCHPHRASE_STATS")).toBeFalse();
    });
  });
});
