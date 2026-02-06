export const NOVEL_SUMMARY_TEMPLATE = `目标：生成章节摘要/回顾（写入 frontmatter.summary 或独立文件）。

步骤：
1) 读取 .opencode/novel/profile.md（缺失则自动补跑 compact 画像）。
2) 调用 tool: novel_context_pack（task=review；chapter_id=目标）
3) 调用 skill: novel-summary-expert（需引用 profile）
4) 将摘要写入章节 frontmatter.summary（可选）或 manuscript/chapters/<chapter_id>.summary.md。`;
