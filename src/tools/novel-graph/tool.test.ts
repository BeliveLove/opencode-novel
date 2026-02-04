import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelGraphTool } from "./tool";

describe("novel_graph", () => {
  it("labels nodes with name when available", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
characters: [char-zhangsan, char-lisi]
threads_opened: []
threads_advanced: []
threads_closed: []
---

# 第一章：起风

正文……
`,
      );

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---\nid: char-zhangsan\nname: "张三"\n---\n`,
      );
      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-lisi.md",
        `---\nid: char-lisi\nname: "李四"\n---\n`,
      );

      const tool = createNovelGraphTool({ projectRoot: rootDir, config });
      await executeTool(tool, { rootDir, kind: "relationships", writeFile: true });

      const graphPath = path.join(rootDir, ".opencode", "novel", "GRAPH", "RELATIONSHIPS.mmd");
      expect(existsSync(graphPath)).toBeTrue();
      const content = readFileSync(graphPath, "utf8");
      expect(content).toContain(`char-zhangsan["张三 (char-zhangsan)"]`);
      expect(content).toContain(`char-lisi["李四 (char-lisi)"]`);
    });
  });
});

