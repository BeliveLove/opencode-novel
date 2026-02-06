export const NOVEL_POLISH_TEMPLATE = `目标：润色章节输出，默认写入新文件，不覆盖原章。
硬约束：
- 未显式传入 --apply 时，禁止覆盖 manuscript/chapters/<chapter_id>.md。
- 默认输出：manuscript/chapters/<chapter_id>.polish.md。

步骤：
1) 调用 tool: novel_context_pack（task=rewrite，chapter_id=目标章节）。
2) 调用 skill: novel-polish-expert（conservative/rewrite）。
3) 写入 .polish.md（默认）。
4) 仅当 --apply=true 且用户再次确认时，才允许覆盖原章。`;
