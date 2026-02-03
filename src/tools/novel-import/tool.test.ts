import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { NovelConfigSchema } from "../../config/schema"
import { withTempDir, writeFixtureFile, extractResultJson } from "../../../test/utils"
import { createNovelImportTool } from "./tool"

describe("novel_import", () => {
  it("splits multi-chapter markdown into manuscript/chapters", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir })

      writeFixtureFile(
        rootDir,
        "drafts/book.md",
        `# 第1章 起风

内容A

# 第2章 结尾

内容B
`,
      )

      const tool = createNovelImportTool({ projectRoot: rootDir, config })
      const output = await (tool as any).execute({ rootDir, fromDir: rootDir, mode: "copy" })
      const json = extractResultJson(String(output)) as any

      expect(json.version).toBe(1)
      expect(json.writtenChapters.length).toBeGreaterThanOrEqual(2)
      expect(existsSync(path.join(rootDir, "manuscript", "chapters"))).toBeTrue()
      expect(readFileSync(path.join(rootDir, ".opencode", "novel", "IMPORT_REPORT.md"), "utf8")).toContain("# IMPORT REPORT")
    })
  })
})

