export const NOVEL_POLISH_TEMPLATE = `目标：润色章节输出（默认写入新文件，不覆盖原章；覆盖需显式 --apply）。

步骤：
1) 调用 tool: novel_context_pack（task=rewrite；chapter_id=目标）
2) 调用 skill: novel-polish-expert（conservative/rewrite）
3) 写入 manuscript/chapters/<chapter_id>.polish.md（默认）。`;
