# opencode-novel

面向大众作者的 **OpenCode TUI** 小说创作工具（插件）：用 `/novel-*` 命令把写作流程工程化，并以项目内 Markdown（事实源）自动生成索引与巡检报告（时间线/一致性/伏笔对账/导出）。

> 本项目只做 OpenCode 的命令式/TUI 工作流，不走 Web/小程序路线。

## 功能概览

- `/novel-*`：面向作者的写作流程命令（初始化、导入、索引、写章、巡检、导出）
- `novel_*` tools：确定性工具内核（扫描/索引/一致性/伏笔对账/导出/受控落盘）
- `novel-*` skills：专家提示词库（人物/势力/续写/润色/摘要等）
- `novel-*` agents：在 OpenCode 配置中自动注入（默认 `novel-sentinel` 可见，其余可选）

## 快速开始（作者视角）

1) 安装插件（一次性；Windows 示例）：
   - `bun install`
   - `bun run build`
   - `bun run script/install-opencode.ts -- --target=global`
   - 重启 OpenCode

2) 在 OpenCode 打开你的小说工程目录，然后按顺序运行：
   - `/novel-init "书名"`（建骨架）
   - `/novel-index`（生成索引/报告）
   - `/novel-chapter-plan ch0001`（章节计划）
   - `/novel-chapter-draft ch0001`（生成草稿，默认写新文件）
   - `/novel-export docx`（导出）

## 配置

配置会按顺序合并（后者覆盖前者）：

1) 默认配置（内置）
2) 用户级配置（任一存在即生效）：
   - macOS/Linux：`~/.config/opencode/novel.jsonc`
   - Windows：`%USERPROFILE%\\.config\\opencode\\novel.jsonc`
   - Windows：`%APPDATA%\\opencode\\novel.jsonc`
3) 项目级配置：`<project>/.opencode/novel.jsonc`

配置 schema：构建后生成 `dist/novel.schema.json`（便于编辑器校验/补全）。

### Agents 注入

- `agents_enabled`：是否注入 agents（默认 `true`）
- `agent_name_prefix`：注入到 OpenCode 的 agent 名称前缀（默认 `novel-`）
- `agents_preset`：`core|full`（默认 `core`）
- `agents_primary`：哪些 agent 作为“可选主 Agent”显示在 UI（默认仅 `["sentinel"]`；其他会以 `subagent` 注入，供主编排调用）
- `agents_force_override`：是否强制覆盖 OpenCode 现有同名 agent（默认 `false`）
- `agents`：对特定 agent 做 override（model/temperature/top_p/maxTokens/prompt_append/tools/permission 等）

## 开发与规范

- 代码规范：Biome（`biome.json`），`bun run lint` / `bun run lint:fix`
- 质量门禁：`bun run check`（lint + typecheck + test + build）
- Git 钩子：Lefthook（`.lefthook.yml`），`bun install` 会自动执行 `lefthook install`，pre-push 运行 `bun run check`

## 文档

- 工作流：`docs/workflow.md`
- 命令：`docs/commands.md`
- Skills：`docs/skills.md`
- 数据模型：`docs/data-model.md`
- 一致性规则：`docs/rules.md`
