export const NOVEL_SNAPSHOT_TEMPLATE = `目标：冻结阶段（快照），写入 manuscript/snapshots/（deterministic）。

步骤：
1) 建议先运行：/novel-index、/novel-continuity-check（可选：/novel-foreshadowing-audit）
2) 调用 tool: novel_snapshot
   - args: { tag: $ARGUMENTS }
3) 输出 snapshotDir / savedFiles 摘要与下一步建议。`;
