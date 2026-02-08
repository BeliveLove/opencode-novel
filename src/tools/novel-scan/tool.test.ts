import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelScanTool } from "./tool";
import type { NovelScanArgs, NovelScanResultJson } from "./types";

describe("novel_scan", () => {
  it("parses entities and writes scan cache", async () => {
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
structure:
  act: 1
  beat_id: setup
  beat_goal: "建立主角危机"
scenes:
  - scene_id: ch0001-s01
    objective: "拿到关键线索"
    conflict: "被守卫阻拦"
    outcome: "线索到手但身份暴露"
  - scene_id: ch0001-s02
    objective: "暂时脱身"
    conflict: "城门封锁"
    outcome: "成功脱身，埋下追兵"
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
        "manuscript/chapters/act1/ch0002.md",
        `---
chapter_id: ch0002
title: "第二章：继续"
characters: [char-zhangsan]
threads_opened: []
threads_advanced: [th-001]
threads_closed: []
---

# 第二章：继续

正文……
`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---
id: char-zhangsan
name: "张三"
alias: ["三儿"]
motivation: "查清父亲之死。"
desire: "离开小镇。"
voice:
  catchphrases: ["我不信。"]
---

# 张三
`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-lisi.md",
        `---
id: char-lisi
name: "李四"
---

# 李四
`,
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

# th-001
`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/locations/loc-town.md",
        `---
id: loc-town
name: "镇口"
---

# 镇口
`,
      );

      const tool = createNovelScanTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        mode: "incremental",
        writeCache: true,
      } satisfies NovelScanArgs);
      const json = extractResultJson(String(output)) as NovelScanResultJson;

      expect(json.version).toBe(1);
      expect(json.entities.chapters.length).toBe(2);
      expect(json.entities.characters.length).toBe(2);
      expect(json.entities.threads.length).toBe(1);
      expect(json.entities.chapters[0].structure?.beat_id).toBe("setup");
      expect(json.entities.chapters[0].scenes?.length).toBe(2);
      expect(json.entities.chapters[0].scenes?.[0]?.scene_id).toBe("ch0001-s01");

      const cachePath = path.join(rootDir, ".opencode", "novel", "cache", "scan.json");
      expect(existsSync(cachePath)).toBeTrue();
      expect(readFileSync(cachePath, "utf8")).toContain('"version": 1');
    });
  });
});
