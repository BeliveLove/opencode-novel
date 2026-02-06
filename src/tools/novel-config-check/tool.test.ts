import { describe, expect, it } from "bun:test";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { createNovelConfigCheckTool } from "./tool";
import type { NovelConfigCheckResultJson } from "./types";

describe("novel_config_check", () => {
  it("returns valid=true when merged config has no load errors", async () => {
    await withTempDir(async (rootDir) => {
      const tool = createNovelConfigCheckTool({ projectRoot: rootDir });
      const output = await executeTool(tool, { rootDir });
      const json = extractResultJson(String(output)) as NovelConfigCheckResultJson;

      expect(json.version).toBe(1);
      expect(json.valid).toBeTrue();
      expect(json.diagnostics.length).toBe(0);
    });
  });

  it("returns structured diagnostics when project config is invalid", async () => {
    await withTempDir(async (rootDir) => {
      writeFixtureFile(
        rootDir,
        ".opencode/novel.jsonc",
        `{
  "language": "zh",
  "export": {
    "formats":
}`,
      );

      const tool = createNovelConfigCheckTool({ projectRoot: rootDir });
      const output = await executeTool(tool, { rootDir });
      const json = extractResultJson(String(output)) as NovelConfigCheckResultJson;

      expect(json.valid).toBeFalse();
      expect(json.diagnostics.some((d) => d.code === "CONFIG_LOAD_ERROR")).toBeTrue();
      expect(
        json.diagnostics.some(
          (d) => d.file?.includes(".opencode/novel.jsonc") && d.message.includes("[project]"),
        ),
      ).toBeTrue();
    });
  });
});
