import { describe, expect, it } from "bun:test"
import { existsSync } from "node:fs"
import path from "node:path"
import { NovelConfigSchema } from "../../config/schema"
import { withTempDir } from "../../../test/utils"
import { createNovelScaffoldTool } from "./tool"

describe("novel_scaffold", () => {
  it("creates manuscript and derived directories", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir })
      const tool = createNovelScaffoldTool({ projectRoot: rootDir, config })

      const output = await (tool as any).execute({
        rootDir,
        manuscriptDir: "manuscript",
        bookTitle: "测试书",
        writeConfigJsonc: true,
        writeTemplates: true,
      })
      expect(String(output)).toContain("## Result (JSON)")

      expect(existsSync(path.join(rootDir, "manuscript", "chapters"))).toBeTrue()
      expect(existsSync(path.join(rootDir, ".opencode", "novel", "cache"))).toBeTrue()
      expect(existsSync(path.join(rootDir, ".opencode", "novel.jsonc"))).toBeTrue()
    })
  })
})

