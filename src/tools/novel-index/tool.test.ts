import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelIndexTool } from "./tool";

describe("novel_index", () => {
  it("writes stable INDEX/TIMELINE/THREADS_REPORT", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
pov: third_limited
timeline:
  date: "2026-02-03"
  start: "20:00"
  end: "20:30"
  location: loc-town
characters: [char-zhangsan, char-lisi]
threads_opened: [th-001]
threads_advanced: []
threads_closed: []
summary: "张三在镇口遇到李四。"
tags: [intro]
---

# 第一章：起风

正文……
`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---\nid: char-zhangsan\nname: "张三"\nalias: ["三儿"]\n---\n`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-lisi.md",
        `---\nid: char-lisi\nname: "李四"\n---\n`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-001.md",
        `---
thread_id: th-001
type: mystery
status: open
opened_in:
  chapter_id: ch0001
expected_close_by: ch0010
close_plan: "第10章回收。"
closed_in: null
---
`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/locations/loc-town.md",
        `---\nid: loc-town\nname: "镇口"\n---\n`,
      );

      const tool = createNovelIndexTool({ projectRoot: rootDir, config });
      await executeTool(tool, { rootDir, forceWrite: true });

      const indexPath = path.join(rootDir, ".opencode", "novel", "INDEX.md");
      const content = readFileSync(indexPath, "utf8");

      expect(content).toContain("<!-- novel:derived v1; DO NOT EDIT BY HAND -->");
      expect(content).toContain("# INDEX");
      expect(content).toContain("| ch0001 | 第一章：起风 |");
      expect(content).toContain("| char-zhangsan | 张三 |");
      expect(content).toContain("| th-001 | mystery | open | ch0001 | ch0010 |");
      expect(content).toContain("| loc-town | 镇口 | 1 |");
    });
  });
});
