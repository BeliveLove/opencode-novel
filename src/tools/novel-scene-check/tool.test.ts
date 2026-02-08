import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelSceneCheckTool } from "./tool";
import type { NovelSceneArgs, NovelSceneResultJson } from "./types";

describe("novel_scene_check", () => {
  it("detects missing scene fields and no outcome progression", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章"
scenes:
  - scene_id: ch0001-s01
    objective: "拿到钥匙"
    conflict: ""
    outcome: "拿到钥匙"
---

# 第一章

正文`,
      );

      const tool = createNovelSceneCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        writeReport: true,
      } satisfies NovelSceneArgs);
      const json = extractResultJson(String(output)) as NovelSceneResultJson;

      expect(json.version).toBe(1);
      expect(json.stats.sceneCount).toBe(1);
      expect(json.findings.some((finding) => finding.code === "SCN_NO_CONFLICT")).toBeTrue();
      expect(json.findings.some((finding) => finding.code === "SCN_NO_OUTCOME_CHANGE")).toBeTrue();
      expect(json.reportPath).toBeTruthy();

      const reportAbs = path.join(rootDir, String(json.reportPath).replaceAll("/", path.sep));
      expect(existsSync(reportAbs)).toBeTrue();
    });
  });
});
