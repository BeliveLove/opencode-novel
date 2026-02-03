import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { NovelConfigSchema } from "../../config/schema"
import { withTempDir, writeFixtureFile } from "../../../test/utils"
import { createNovelApplyCandidatesTool } from "./tool"

describe("novel_apply_candidates", () => {
  it("creates entity files and patches frontmatter (dryRun=false)", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir })

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章"
characters: []
---

# 第一章
正文
`,
      )

      const candidatesPath = " .opencode/novel/cache/candidates.json".trim()
      writeFixtureFile(
        rootDir,
        candidatesPath,
        JSON.stringify(
          {
            version: 1,
            generatedAt: "2026-02-03T00:00:00Z",
            scope: { kind: "chapter", chapter_id: "ch0001" },
            ops: [
              { op: "ensure_entity", kind: "character", id: "char-new", name: "新角色" },
              {
                op: "patch_frontmatter",
                filePath: "manuscript/chapters/ch0001.md",
                patch: { characters: ["char-new"] },
                mode: "merge",
              },
            ],
          },
          null,
          2,
        ),
      )

      const tool = createNovelApplyCandidatesTool({ projectRoot: rootDir, config })
      await (tool as any).execute({ rootDir, candidatesPath, dryRun: false, writeReport: true })

      expect(existsSync(path.join(rootDir, "manuscript", "characters", "char-new.md"))).toBeTrue()
      const chapter = readFileSync(path.join(rootDir, "manuscript", "chapters", "ch0001.md"), "utf8")
      expect(chapter).toContain("characters:")
      expect(chapter).toContain("char-new")
    })
  })
})

