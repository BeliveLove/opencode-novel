import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelOutlineTool } from "./tool";
import type { NovelOutlineArgs, NovelOutlineResultJson } from "./types";

describe("novel_outline", () => {
  it("generates three-act outline and writes json file", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      const tool = createNovelOutlineTool({ projectRoot: rootDir, config });

      const output = await executeTool(tool, {
        rootDir,
        title: "测试小说",
        mode: "three_act",
        writeFile: true,
      } satisfies NovelOutlineArgs);
      const json = extractResultJson(String(output)) as NovelOutlineResultJson;

      expect(json.version).toBe(1);
      expect(json.outlineJson.mode).toBe("three_act");
      expect(json.outlineJson.acts.length).toBe(3);
      expect(json.outlinePath).toBeTruthy();

      const outlineAbs = path.join(rootDir, String(json.outlinePath).replaceAll("/", path.sep));
      expect(existsSync(outlineAbs)).toBeTrue();
      const outlineRaw = JSON.parse(readFileSync(outlineAbs, "utf8")) as { title: string };
      expect(outlineRaw.title).toBe("测试小说");
    });
  });
});
