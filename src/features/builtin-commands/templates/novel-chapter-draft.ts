export const NOVEL_CHAPTER_DRAFT_TEMPLATE = `目标：基于章节计划生成草稿，默认输出新文件，不覆盖原章。
硬约束：
- 未显式传入 --apply 时，禁止覆盖 manuscript/chapters/<chapter_id>.md。
- 默认输出：manuscript/chapters/<chapter_id>.draft.md。

步骤：
1) 读取 .opencode/novel/profile.md（缺失则自动补跑 compact 画像）。
2) 调用 tool: novel_context_pack（task=draft，chapter_id=目标章节）。
3) 调用 skill: novel-continuation-expert 或 novel-polish-expert（以草稿为目标，需引用 profile）。
4) 将草稿写入 .draft.md（默认）。
5) 若用户要求覆盖，必须二次确认并建议先执行 /novel-snapshot。`;
