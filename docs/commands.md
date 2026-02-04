# Commands（/novel-*）

OpenCode 自定义命令会从以下位置加载：

- 全局：`~/.config/opencode/commands/*.md`
- 项目：`<project>/.opencode/commands/*.md`

本仓库提供一套 `/novel-*` 命令模板，可用 `bun run script/install-opencode.ts -- --target=global` 一键安装到全局目录。

## 初始化与工程

- `/novel-init <title>`：创建骨架（内部调用 `novel_scaffold`）
- `/novel-import [--from=<path>] [--mode=analyze|copy]`：导入并按章拆分（调用 `novel_import`）
- `/novel-bootstrap [--from=<path>] [--stubs]`：一键流水线
- `/novel-index`：生成索引（`novel_index`）
- `/novel-entities-audit [--stubs]`：实体缺口（`novel_entity_gaps`）
- `/novel-graph <relationships|factions>`：Mermaid 图（`novel_graph`）
- `/novel-character-report`：人物曲线（`novel_character_report`）

## 巡检

- `/novel-continuity-check`：一致性报告（`novel_continuity_check`）
- `/novel-foreshadowing-audit`：伏笔对账（`novel_foreshadowing_audit`）
- `/novel-style-check`：风格检查（`novel_style_check`）

## 生成与写作（模板驱动）

- `/novel-outline`：大纲（建议调用 `novel-oracle`）
- `/novel-character <id>`：角色卡（建议调用 `novel-character-expert`）
- `/novel-faction <id>`：势力卡（建议调用 `novel-faction-relations`）
- `/novel-thread <thread_id>`：线程卡（建议调用 `novel-foreshadowing-unresolved`）
- `/novel-chapter-plan <chapter_id>`：章节计划
- `/novel-chapter-draft <chapter_id>`：草稿（默认新文件）
- `/novel-chapter-review <chapter_id>`：审稿（最小改动建议）
- `/novel-rewrite <chapter_id>`：重写（默认新文件）
- `/novel-polish <chapter_id>`：润色（默认新文件）
- `/novel-summary <chapter_id>`：摘要

## Candidates（受控落盘）

- `/novel-extract-entities`：抽取实体候选并生成 candidates.json（由 skill 输出 JSON）
- `/novel-apply-candidates`：受控落盘（`novel_apply_candidates`）

## 导出

- `/novel-export <md|html|epub|docx>`：导出（`novel_export`；当前支持 md/html/docx，epub 预留）
- `/novel-snapshot <tag>`：快照（模板说明）
