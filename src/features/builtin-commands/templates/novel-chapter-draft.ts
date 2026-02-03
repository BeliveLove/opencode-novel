export const NOVEL_CHAPTER_DRAFT_TEMPLATE = `目标：基于章节计划生成草稿（默认输出新文件，不覆盖原章）。

步骤：
1) 调用 tool: novel_context_pack（task=draft；chapter_id=目标章）
2) 调用 skill: novel-continuation-expert 或 novel-polish-expert（以草稿为目标）
3) 将草稿写入 manuscript/chapters/<chapter_id>.draft.md（默认）
4) 提醒：需要 apply 覆盖时必须显式确认。`;
