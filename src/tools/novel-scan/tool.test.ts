import { describe, expect, it } from "bun:test"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { NovelConfigSchema } from "../../config/schema"
import { withTempDir, writeFixtureFile, extractResultJson } from "../../../test/utils"
import { createNovelScanTool } from "./tool"

describe("novel_scan", () => {
  it("parses entities and writes scan cache", async () => {
    await withTempDir(async (rootDir) => {
      const config = NovelConfigSchema.parse({ projectRoot: rootDir })

      writeFixtureFile(
        rootDir,
        "manuscript/chapters/ch0001.md",
        `---
chapter_id: ch0001
title: "第一章：起风"
pov: third_limited
timeline:
  date: "2026-02-03"
  start: "20:00"
  end: "20:30"
  location: loc-town
characters: [char-zhangsan, char-lisi]
threads_opened: [th-001]
threads_advanced: []
threads_closed: []
summary: "张三在镇口遇到李四。"
tags: [intro]
---

# 第一章：起风

正文……
`,
      )

      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-zhangsan.md",
        `---
id: char-zhangsan
name: "张三"
alias: ["三儿"]
motivation: "查清父亲之死。"
desire: "离开小镇。"
voice:
  catchphrases: ["我不信。"]
---

# 张三
`,
      )
      writeFixtureFile(
        rootDir,
        "manuscript/characters/char-lisi.md",
        `---
id: char-lisi
name: "李四"
---

# 李四
`,
      )
      writeFixtureFile(
        rootDir,
        "manuscript/threads/th-001.md",
        `---
thread_id: th-001
type: mystery
status: open
opened_in:
  chapter_id: ch0001
expected_close_by: ch0010
close_plan: "第10章回收。"
closed_in: null
---

# th-001
`,
      )
      writeFixtureFile(
        rootDir,
        "manuscript/locations/loc-town.md",
        `---
id: loc-town
name: "镇口"
---

# 镇口
`,
      )

      const tool = createNovelScanTool({ projectRoot: rootDir, config })
      const output = await (tool as any).execute({ rootDir, mode: "incremental", writeCache: true })
      const json = extractResultJson(String(output)) as any

      expect(json.version).toBe(1)
      expect(json.entities.chapters.length).toBe(1)
      expect(json.entities.characters.length).toBe(2)
      expect(json.entities.threads.length).toBe(1)

      const cachePath = path.join(rootDir, ".opencode", "novel", "cache", "scan.json")
      expect(existsSync(cachePath)).toBeTrue()
      expect(readFileSync(cachePath, "utf8")).toContain("\"version\": 1")
    })
  })
})

