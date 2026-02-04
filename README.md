# opencode-novel

把“写小说”工程化为 OpenCode 插件（Bun/TypeScript），提供可复用的 Tools / Commands / Skills，并以项目内 Markdown 作为事实来源，自动生成索引与巡检报告。

## 功能概览

- Tools（`novel_*`）：扫描、索引、巡检、导出（md/html/epub/docx）、上下文包、受控落盘等（见 `src/tools/`）
- Commands（`/novel-*`）：OpenCode 自定义命令（见 `docs/commands.md`）
- Skills：OpenCode Agent Skills（见 `docs/skills.md`）
- Agents：插件在 `config` hook 中注入 `novel-muse` / `novel-editor` / `novel-sentinel`（可选 `full` 预设导出更多专家）

## 本地调试（Windows 示例）

1. 构建：
   - `bun install`
   - `bun run build`
2. 安装到 OpenCode（推荐）：
   - `bun run script/install-opencode.ts -- --target=global`
   - 重启 OpenCode（插件与自定义命令/技能会自动生效）

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
