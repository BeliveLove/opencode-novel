export const NOVEL_REWRITE_TEMPLATE = `目标：按目标重写章节（不破坏设定/人设），默认输出新文件。

步骤：
1) 调用 tool: novel_context_pack（task=rewrite；chapter_id=目标）
2) 调用 skill: novel-polish-expert（mode=rewrite）或 novel-flaw-finder
3) 写入 manuscript/chapters/<chapter_id>.rewrite.md（默认）。`

