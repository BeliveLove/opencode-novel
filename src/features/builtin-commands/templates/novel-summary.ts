export const NOVEL_SUMMARY_TEMPLATE = `目标：生成章节摘要/回顾（写入 frontmatter.summary 或独立文件）。

步骤：
1) 调用 tool: novel_context_pack（task=review；chapter_id=目标）
2) 调用 skill: novel-summary-expert
3) 将摘要写入章节 frontmatter.summary（可选）或 manuscript/chapters/<chapter_id>.summary.md。`

