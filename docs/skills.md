# Skills（专家能力库）

OpenCode Agent Skills 会从以下位置加载：

- 全局：`~/.config/opencode/skill/<name>/SKILL.md`
- 全局（Windows 兼容）：`%APPDATA%\\opencode\\skill\\<name>\\SKILL.md`
- 项目：`<project>/.opencode/skill/<name>/SKILL.md`

本仓库提供一套专家 skills，可用 `bun run script/install-opencode.ts -- --target=global` 一键安装到全局目录。

兼容说明（旧路径仍支持）：
- 全局：`~/.config/opencode/skills/*`、`%APPDATA%\\opencode\\skills\\*`
- 项目：`<project>/.opencode/skills/*`

覆盖规则（同名 skill）：项目级 > 全局级；官方目录（`skill/`）> 旧目录（`skills/`）。

## 列表

- `taxonomy-registry`
- `genre-classifier`
- `trope-classifier`
- `audience-classifier`
- `emotion-classifier`
- `structure-classifier`
- `market-tagger`
- `profile-aggregator`
- `novel-oracle`
- `novel-entity-extractor`
- `novel-character-expert`
- `novel-faction-relations`
- `novel-worldbible-keeper`
- `novel-timeline-keeper`
- `novel-continuity-sentinel`
- `novel-foreshadowing-unresolved`
- `novel-flaw-finder`
- `novel-continuation-expert`
- `novel-polish-expert`
- `novel-summary-expert`

其中 `taxonomy-registry` 会额外携带引用文件：

- `references/taxonomy-v1.md`
- `references/aliases-v1.md`
- `references/conflicts-v1.md`
- `references/changelog.md`

## 统一输出协议

所有 skills 推荐按以下段落输出（标题固定，便于命令复用）：

1) `## Assumptions`
2) `## Findings`
3) `## Recommendations`（P0/P1/P2）
4) `## Questions`（最多 3 个）
5) `## Files To Update`

其中 `novel-entity-extractor` 额外要求输出 `## Result (Structured)`（NovelCandidatesV1 字段）。

标签判定技能（六个 classifier + market-tagger）必须返回统一 JSON：

- `domain`
- `labels[]`（`id/name/confidence/evidence`）
- `unmatched[]`
- `notes[]`

`profile-aggregator` 必须输出可落盘的 `profile` 结构，支持 `compact/full` 两种模式。

## 组件与 Agent 交互准则（总览）

- 分层职责：命令层负责编排，Agent 负责推理决策，Tool 负责事实读取与受控执行，Skill 负责领域能力扩展。
- 主代理策略：默认主代理为 `novel-sentinel`，`novel-muse` 负责创意规划，`novel-editor` 负责审稿裁决。
- 调用顺序：先工具取证，再加载 skill，再产出方案，最后受控落盘与复检。
- 绑定优先：命令声明了 `agent` 时必须优先使用该代理，未声明时按“巡检→sentinel、创意→muse、审校→editor”路由。
- 越权限制：内容类 skill 不得改标签字典；标签类 skill 不得改剧情正文；跨维度判定必须禁止。
- 结果可追溯：输出必须标注依据来源（工具报告、技能结论、目标文件）。

详细规范见：`skills-taxonomy-plan.md` 的“13. 当前所有组件与 Agent 交互准则”。
