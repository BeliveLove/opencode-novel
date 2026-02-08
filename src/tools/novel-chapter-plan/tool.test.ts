import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelChapterPlanTool } from "./tool";
import type { NovelChapterPlanArgs, NovelChapterPlanResultJson } from "./types";

describe("novel_chapter_plan", () => {
  it("builds chapter plan markdown and scene blueprint", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
structure:
  act: 1
  beat_id: setup
---

# 第一章：起风

正文`,
      );

      const tool = createNovelChapterPlanTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, {
        rootDir,
        chapter_id: "ch0001",
        writeFile: true,
      } satisfies NovelChapterPlanArgs);
      const json = extractResultJson(String(output)) as NovelChapterPlanResultJson;

      expect(json.version).toBe(1);
      expect(json.planPath).toBeTruthy();
      expect(json.planJson.chapter_id).toBe("ch0001");
      expect(json.planJson.sceneBlueprint.length).toBe(3);
      expect(json.planJson.sceneBlueprint[0].scene_id).toBe("ch0001-s01");

      const planAbs = path.join(rootDir, String(json.planPath).replaceAll("/", path.sep));
      expect(existsSync(planAbs)).toBeTrue();
      expect(readFileSync(planAbs, "utf8")).toContain("Scene Blueprint");
    });
  });
});
