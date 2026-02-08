import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelStructureCheckTool } from "./tool";
import type { NovelStructureArgs, NovelStructureResultJson } from "./types";

describe("novel_structure_check", () => {
  it("reports missing required beats and writes structure report", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章"
structure:
  act: 1
  beat_id: setup
  beat_goal: "建立冲突"
---

# 第一章

正文`,
      );

      const tool = createNovelStructureCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        writeReport: true,
      } satisfies NovelStructureArgs);
      const json = extractResultJson(String(output)) as NovelStructureResultJson;

      expect(json.version).toBe(1);
      expect(
        json.findings.some((finding) => finding.code === "STR_REQUIRED_BEAT_MISSING"),
      ).toBeTrue();
      expect(json.stats.coverage).toBeLessThan(1);
      expect(json.reportPath).toBeTruthy();

      const reportAbs = path.join(rootDir, String(json.reportPath).replaceAll("/", path.sep));
      expect(existsSync(reportAbs)).toBeTrue();
    });
  });
});
