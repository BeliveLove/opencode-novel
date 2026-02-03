export const NOVEL_CONTINUITY_CHECK_TEMPLATE = `目标：一致性报告（CONTINUITY_REPORT.md）。

步骤：
1) 调用 tool: novel_continuity_check（scope=all 或 chapter）
2) 若 errors>0：建议使用 novel-continuity-sentinel skill 给最小修复路径。`

