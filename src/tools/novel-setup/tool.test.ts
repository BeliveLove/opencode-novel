import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeTool, withTempDir } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelSetupTool } from "./tool";

describe("novel_setup", () => {
  it("scaffolds project and exports builtin commands/skills", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });
      const tool = createNovelSetupTool({ projectRoot: rootDir, config });

      await executeTool(tool, {
        rootDir,
        bookTitle: "测试书名",
        exportCommands: true,
        exportSkills: true,
        writeConfigJsonc: true,
      });

      expect(existsSync(path.join(rootDir, "manuscript", "chapters"))).toBeTrue();
      expect(existsSync(path.join(rootDir, ".opencode", "novel.jsonc"))).toBeTrue();
      expect(
        existsSync(path.join(rootDir, ".opencode", "commands", "novel-bootstrap.md")),
      ).toBeTrue();
      expect(
        existsSync(path.join(rootDir, ".opencode", "skill", "novel-oracle", "SKILL.md")),
      ).toBeTrue();
      expect(
        existsSync(
          path.join(
            rootDir,
            ".opencode",
            "skill",
            "taxonomy-registry",
            "references",
            "taxonomy-v1.md",
          ),
        ),
      ).toBeTrue();
    });
  });
});
