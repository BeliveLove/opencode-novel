# 工作流（OpenCode TUI：从 0 到 1 写完一章）

> 这是一个纯命令式/TUI 工作流：你只需要在 OpenCode 中打开小说工程目录，然后输入 `/novel-*` 命令即可。

## 0) 安装（一次性）

在本插件工程目录执行：

- `bun install`
- `bun run build`
- `bun run script/install-opencode.ts -- --target=global`

然后重启 OpenCode（会自动加载插件与 `/novel-*` 命令、`novel-*` skills）。

## 1) 初始化工程

- 运行：`/novel-init "书名"`
- 产物：
  - `manuscript/`（事实源目录）
  - `.opencode/novel/`（派生目录）
  - `.opencode/novel.jsonc`（项目级配置）

## 2) 导入（可选）

已有草稿目录可用：
- `/novel-import`（不改原文，默认按章节标题拆分，写入 `manuscript/chapters/*.md`）
- 然后运行：`/novel-index`

## 3) 索引与巡检

- `/novel-index`：生成派生索引（建议写作前/导出前都跑一次）
- `novel_index`：生成派生索引
  - `.opencode/novel/INDEX.md`
  - `.opencode/novel/TIMELINE.md`
  - `.opencode/novel/THREADS_REPORT.md`
- `novel_entity_gaps`：实体缺口盘点（可选补 stub）
- `novel_continuity_check`：一致性检查（时间/引用/线程等）
- `novel_foreshadowing_audit`：伏笔对账（线程卡的 close_plan 与章节标注）
- `novel_style_check`：风格检查（词表/口癖统计）

## 4) 章节写作（建议）

推荐顺序：
1) `/novel-chapter-plan <chapter_id>`（生成计划，默认写新文件）
2) `/novel-chapter-draft <chapter_id>`（生成草稿，默认写新文件）
3) `/novel-chapter-review <chapter_id>`（审稿，最小改动建议）
4) `/novel-polish <chapter_id>`（润色，默认写新文件）

落盘原则（重要）：
- 默认不覆盖原章：草稿/润色/重写会写入新文件（如 `.draft.md` / `.polish.md`），避免误伤你的正文。
- 需要覆盖或批量落盘时，必须显式确认（例如 candidates 的 dryRun→apply 流程）。

## 5) 抽取实体候选 → 受控落盘（可选）

1) `/novel-extract-entities`：让模型输出 `candidates.json`（NovelCandidatesV1）
2) `/novel-apply-candidates`：由工具受控落盘
   - 新建缺失实体文件
   - 仅 patch YAML frontmatter（不改正文）

## 6) 导出

- `/novel-export md` / `/novel-export html` / `/novel-export epub` / `/novel-export docx`
- 产物默认写入：`export/`
