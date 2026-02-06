export const NOVEL_CHAPTER_PLAN_TEMPLATE = `目标：生成章节计划（场景列表、信息分配、伏笔推进点），默认写入新文件，不覆盖原章。
硬约束：
- 未显式传入 --apply 时，禁止覆盖 manuscript/chapters/<chapter_id>.md。
- 默认输出：manuscript/chapters/<chapter_id>.plan.md。

步骤：
1) 解析参数：chapter_id（如 ch0001）。
2) 调用 tool: novel_context_pack（task=draft，chapter_id=目标章节）。
3) 调用 skill: novel-oracle 或 novel-timeline-keeper。
4) 输出章节计划到 .plan.md；若用户要求覆盖，先提示风险并建议先 /novel-snapshot。`;
