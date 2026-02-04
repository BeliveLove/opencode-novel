import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import path from "node:path";
import { executeTool, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelBootstrapTool } from "./tool";

describe("novel_bootstrap", () => {
  it("runs scaffold→import→index→gaps→graphs→character report", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(
        rootDir,
        "drafts/book.md",
        `# Chapter 1: Start

Some text
`,
      );

      const tool = createNovelBootstrapTool({ projectRoot: rootDir, config });
      await executeTool(tool, { rootDir, fromDir: rootDir, importMode: "copy", createStubs: true });

      expect(existsSync(path.join(rootDir, "manuscript", "chapters", "ch0001.md"))).toBeTrue();
      expect(existsSync(path.join(rootDir, ".opencode", "novel", "INDEX.md"))).toBeTrue();
      expect(existsSync(path.join(rootDir, ".opencode", "novel", "ENTITY_GAPS.md"))).toBeTrue();
      expect(
        existsSync(path.join(rootDir, ".opencode", "novel", "GRAPH", "RELATIONSHIPS.mmd")),
      ).toBeTrue();
      expect(existsSync(path.join(rootDir, ".opencode", "novel", "CHARACTER_REPORT.md"))).toBeTrue();
    });
  });
});

