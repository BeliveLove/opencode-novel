import { describe, expect, it } from "bun:test";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelContinuityCheckTool } from "./tool";
import type { NovelContinuityResultJson } from "./types";

describe("novel_continuity_check", () => {
  it("returns explainable findings with rule/evidence/fix_hint fields", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "Chapter 1"
characters: [char-missing]
threads_opened: [thread-missing]
---

# Chapter 1

Content`,
      );

      const tool = createNovelContinuityCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, writeReport: false });
      const json = extractResultJson(String(output)) as NovelContinuityResultJson;

      const charFinding = json.findings.find((f) => f.ruleId === "CONT_REF_CHARACTER_UNDEFINED");
      expect(charFinding).toBeDefined();
      expect(charFinding?.severity === "warn" || charFinding?.severity === "error").toBeTrue();
      expect(charFinding?.evidence.length).toBeGreaterThan(0);
      expect(charFinding?.evidence[0]?.file).toContain("manuscript/chapters/ch0001.md");
      expect(Boolean(charFinding?.suggestedFix)).toBeTrue();
      expect(charFinding?.repro).toBe("/novel-continuity-check --scope=all");
    });
  });

  it("escalates warn findings to error when strictMode=true", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({
        projectRoot: rootDir,
        continuity: { strictMode: true },
      });
      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "Chapter 1"
characters: [char-missing]
---

# Chapter 1`,
      );

      const tool = createNovelContinuityCheckTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, writeReport: false });
      const json = extractResultJson(String(output)) as NovelContinuityResultJson;

      const charFinding = json.findings.find((f) => f.ruleId === "CONT_REF_CHARACTER_UNDEFINED");
      expect(charFinding).toBeDefined();
      expect(charFinding?.severity).toBe("error");
      expect(json.stats.errors).toBeGreaterThan(0);
    });
  });
});
