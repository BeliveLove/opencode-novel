# Commands（`/novel-*`）

OpenCode 会从以下位置加载命令模板：

- 全局：`~/.config/opencode/commands/*.md`
- 全局（Windows）：`%APPDATA%\opencode\commands\*.md`
- 项目：`<project>/.opencode/commands/*.md`

兼容旧目录（仍支持）：

- 全局：`~/.config/opencode/command/*.md`、`%APPDATA%\opencode\command\*.md`
- 项目：`<project>/.opencode/command/*.md`

覆盖优先级（同名命令）：项目级 > 全局级；`commands/` > `command/`。

## 统一输出约定

- 所有工具命令输出统一为四段：`Summary`、`Result (JSON)`、`Diagnostics`、`Next Steps`
- `Result (JSON)` 统一包含：`version` + `schemaVersion`（当前两者值一致）
- 建议消费方优先读取 `schemaVersion`，并兼容回退到 `version`
- `/novel-index` 额外包含：`generatedAt`（生成时间）与 `scanScope`（扫描范围）

## 初始化与工程

- `/novel-init <title>`：创建项目骨架（内部调用 `novel_scaffold`）
- `/novel-import [--from=<path>] [--mode=analyze|copy]`：导入并拆章（`novel_import`）
- `/novel-bootstrap [--from=<path>] [--stubs]`：一键流水线
- `/novel-index`：生成索引（`novel_index`）
  - 支持增量缓存：输出包含 `cache hits/misses`
  - 缓存文件：`.opencode/novel/cache/scan.json`
- `/novel-config-check`：检查配置合并与 schema 诊断（source/path 结构化输出）
- `/novel-entities-audit [--stubs]`：实体缺口（`novel_entity_gaps`）
- `/novel-graph <relationships|factions>`：Mermaid 图（`novel_graph`）
- `/novel-character-report`：人物报告（`novel_character_report`）

## 巡检

- `/novel-continuity-check`：一致性报告（`novel_continuity_check`）
- `/novel-foreshadowing-audit`：伏笔对账（`novel_foreshadowing_audit`）
- `/novel-style-check`：风格检查（`novel_style_check`）
  - 可选参数：`catchphraseMaxCount`、`catchphraseReportMissing`

## 生成与写作（模板驱动）

- `/novel-outline`
- `/novel-character <id>`
- `/novel-faction <id>`
- `/novel-thread <thread_id>`
- `/novel-chapter-plan <chapter_id> [--apply]`：默认写 `.plan.md`，不覆盖原章
- `/novel-chapter-draft <chapter_id> [--apply]`：默认写 `.draft.md`，不覆盖原章
- `/novel-chapter-review <chapter_id>`：输出最小改动建议，不直接改写正文
- `/novel-continuation <chapter_id> [--apply]`：默认写 `.continue.md`，不覆盖原章
- `/novel-rewrite <chapter_id> [--goal=...] [--apply]`：默认写 `.rewrite.md`，不覆盖原章
- `/novel-polish <chapter_id> [--mode=conservative|rewrite] [--apply]`：默认写 `.polish.md`
- `/novel-summary <chapter_id>`

## Candidates（受控落盘）

- `/novel-extract-entities`：生成 `candidates.json`
- `/novel-apply-candidates`：受控落盘（`novel_apply_candidates`）
  - 默认 `dryRun=true`
  - 可选快照：`snapshot=true` + `snapshotTag=...`（写入 `manuscript/snapshots/`）
  - 默认仅 patch frontmatter，不改正文

## 导出

- `/novel-export [md|html|epub|docx]`：导出（`novel_export`），不填则按 `config.export.formats` 批量导出
  - 支持预检/质量门禁：`export.preflight.enabled=true`
  - 支持 DOCX 模板：`docxTemplate=default|manuscript`（或 `export.docx.template`）
  - 成功导出会生成 `*.manifest.json`，包含章节与导出文件 `sha256`，用于可复现对账
- `/novel-snapshot <tag>`：快照（`novel_snapshot`）
