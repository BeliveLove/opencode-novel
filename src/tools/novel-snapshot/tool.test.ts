import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { executeTool, extractResultJson, withTempDir, writeFixtureFile } from "../../../test/utils";
import { NovelConfigSchema } from "../../config/schema";
import { createNovelSnapshotTool } from "./tool";
import type { NovelSnapshotResultJson } from "./types";

describe("novel_snapshot", () => {
  it("copies bible + derived reports into manuscript/snapshots", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir });

      writeFixtureFile(rootDir, "manuscript/bible/world.md", "# 世界观\n\n测试。");
      writeFixtureFile(rootDir, ".opencode/novel/INDEX.md", "# INDEX\n\n测试。");

      const tool = createNovelSnapshotTool({ projectRoot: rootDir, config });
      const output = await executeTool(tool, { rootDir, tag: "milestone-1" });
      const json = extractResultJson(String(output)) as NovelSnapshotResultJson;

      expect(json.version).toBe(1);
      expect(json.snapshotDir).toContain("manuscript/snapshots/");
      expect(json.savedFiles.length).toBeGreaterThan(0);

      const snapshotDirAbs = path.join(rootDir, json.snapshotDir.replaceAll("/", path.sep));
      expect(existsSync(path.join(snapshotDirAbs, "bible", "world.md"))).toBeTrue();
      expect(existsSync(path.join(snapshotDirAbs, "derived", "INDEX.md"))).toBeTrue();
      expect(existsSync(path.join(snapshotDirAbs, "SNAPSHOT.md"))).toBeTrue();

      const manifest = readFileSync(path.join(snapshotDirAbs, "SNAPSHOT.md"), "utf8");
      expect(manifest).toContain("tag: milestone-1");
      expect(manifest).toContain("manuscript/bible/world.md");
      expect(manifest).toContain(".opencode/novel/INDEX.md");
    });
  });
});
