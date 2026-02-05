import { describe, expect, it } from "bun:test";
import { utimesSync } from "node:fs";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelForeshadowingAuditTool } from "./tool";
import type { NovelForeshadowingArgs, NovelForeshadowingResultJson } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("novel_foreshadowing_audit", () => {
  it("warns on stale open threads based on threads.staleDaysWarn", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        threads: { staleDaysWarn: 1 },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
---

正文段落 A。
`,
      );

      const threadAbs = writeFixtureFile(
        rootDir,
        "manuscript/threads/th-test.md",
        `---
thread_id: th-test
status: open
close_plan: "之后回收"
---

线程内容。
`,
      );

      const twoDaysAgo = new Date(Date.now() - 2 * DAY_MS);
      utimesSync(threadAbs, twoDaysAgo, twoDaysAgo);

      const tool = createNovelForeshadowingAuditTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        writeReport: false,
      } satisfies NovelForeshadowingArgs);

      const json = extractResultJson(String(output)) as NovelForeshadowingResultJson;

      expect(json.version).toBe(1);
      expect(json.items.length).toBe(1);
      expect(json.items[0]?.thread_id).toBe("th-test");
      expect(json.items[0]?.issues.some((i) => i.code === "THREAD_STALE")).toBeTrue();
    });
  });

  it("skips audit when threads.enabled=false", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        threads: { enabled: false, staleDaysWarn: 1 },
      });

      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-test.md",
        `---
thread_id: th-test
status: open
close_plan: "之后回收"
---

线程内容。
`,
      );

      const tool = createNovelForeshadowingAuditTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        writeReport: false,
      } satisfies NovelForeshadowingArgs);

      const json = extractResultJson(String(output)) as NovelForeshadowingResultJson;

      expect(json.version).toBe(1);
      expect(json.items.length).toBe(0);
      expect(json.diagnostics.some((d) => d.code === "THREADS_DISABLED")).toBeTrue();
    });
  });
});
