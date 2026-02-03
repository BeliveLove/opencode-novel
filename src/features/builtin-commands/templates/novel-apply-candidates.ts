export const NOVEL_APPLY_CANDIDATES_TEMPLATE = `目标：把 candidates 以受控方式应用到 manuscript/（仅 frontmatter/新建实体文件；不改正文）。

步骤：
1) 调用 tool: novel_apply_candidates（默认 dryRun=true）
2) 展示 APPLY_REPORT 摘要，并询问用户是否执行 dryRun=false
3) 用户确认后再次调用 novel_apply_candidates { dryRun:false }
4) 最后建议：/novel-index 与 /novel-continuity-check 复核。`

