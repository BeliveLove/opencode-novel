import { describe, expect, it } from "bun:test";
import { extractResultJson, executeTool, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelContextPackTool } from "./tool";
import type { NovelContextPackResultJson } from "./types";

describe("novel_context_pack", () => {
  it("defaults budget to config.contextPack.maxChars", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
summary: "测试摘要"
characters: []
threads_opened: []
threads_advanced: []
threads_closed: []
---

# 第一章：起风

测试正文
`,
      );

      const tool = createNovelContextPackTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        task: "draft",
        chapter_id: "ch0001",
        include: { bible: false, characters: false, openThreads: false, lastChapters: 0 },
        writeFile: false,
      });
      const json = extractResultJson(String(output)) as NovelContextPackResultJson;
      expect(json.stats.budgetChars).toBe(config.contextPack.maxChars);
    });
  });

  it("excludes closed threads when include.openThreads=true", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
summary: "测试摘要"
characters: []
threads_opened: [th-001, th-002]
threads_advanced: [th-003]
threads_closed: [th-002]
---

# 第一章：起风

测试正文
`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-001.md",
        `---\nthread_id: th-001\nstatus: open\n---\n`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-002.md",
        `---\nthread_id: th-002\nstatus: closed\n---\n`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-003.md",
        `---\nthread_id: th-003\nstatus: closed\n---\n`,
      );

      const tool = createNovelContextPackTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        task: "draft",
        chapter_id: "ch0001",
        include: { bible: false, characters: false, openThreads: true, lastChapters: 0 },
        writeFile: false,
      });
      const json = extractResultJson(String(output)) as NovelContextPackResultJson;

      const included = new Set(json.included.map((i) => i.path));
      expect(included.has("manuscript/threads/th-001.md")).toBeTrue();
      expect(included.has("manuscript/threads/th-002.md")).toBeFalse();
      expect(included.has("manuscript/threads/th-003.md")).toBeFalse();
    });
  });
});
