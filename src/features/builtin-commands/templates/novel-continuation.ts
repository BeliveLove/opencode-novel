export const NOVEL_CONTINUATION_TEMPLATE = `目标：续写下一段/下一章（使用 context pack），默认输出新文件。

步骤：
1) 调用 tool: novel_context_pack（task=rewrite 或 draft；chapter_id=目标）
2) 调用 skill: novel-continuation-expert（可给 A/B 分支）
3) 写入 manuscript/chapters/<chapter_id>.continue.md（默认）。`

