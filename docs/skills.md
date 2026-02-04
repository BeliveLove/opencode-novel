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

## 统一输出协议

所有 skills 推荐按以下段落输出（标题固定，便于命令复用）：

1) `## Assumptions`
2) `## Findings`
3) `## Recommendations`（P0/P1/P2）
4) `## Questions`（最多 3 个）
5) `## Files To Update`

其中 `novel-entity-extractor` 额外要求输出 `## Result (JSON)`（NovelCandidatesV1）。
