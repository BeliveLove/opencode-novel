export const NOVEL_REWRITE_TEMPLATE = `目标：按目标重写章节（不破坏设定/人设），默认输出新文件。
硬约束：
- 未显式传入 --apply 时，禁止覆盖 manuscript/chapters/<chapter_id>.md。
- 默认输出：manuscript/chapters/<chapter_id>.rewrite.md。

步骤：
1) 调用 tool: novel_context_pack（task=rewrite，chapter_id=目标章节）。
2) 调用 skill: novel-polish-expert（mode=rewrite）或 novel-flaw-finder。
3) 写入 .rewrite.md（默认）；如需覆盖，必须显式确认并建议先 /novel-snapshot。`;
