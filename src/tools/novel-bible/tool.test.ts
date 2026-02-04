import { describe, expect, it } from "bun:test";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelBibleTool } from "./tool";
import type { NovelBibleResultJson } from "./types";

describe("novel_bible", () => {
  it("parses numbered list rules like 1. ...", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(rootDir, "manuscript/bible/rules.md", `1. 规则一：不允许时间穿越\n`);

      const tool = createNovelBibleTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, writeDerivedFiles: false });
      const json = extractResultJson(String(output)) as NovelBibleResultJson;

      expect(json.rules.length).toBe(1);
      expect(json.rules[0]?.text).toBe("规则一：不允许时间穿越");
    });
  });
});

