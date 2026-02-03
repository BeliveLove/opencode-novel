# Skills（专家能力库）

本插件通过 `skill` 工具暴露内置 skills；也支持项目级覆盖：`.opencode/skills/`。

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

