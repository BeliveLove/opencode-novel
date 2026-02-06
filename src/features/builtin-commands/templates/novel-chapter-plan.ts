export const NOVEL_CHAPTER_PLAN_TEMPLATE = `目标：生成章节计划（场景列表、信息分配、伏笔推进点），默认写入新文件，不覆盖原章。
硬约束：
- 未显式传入 --apply 时，禁止覆盖 manuscript/chapters/<chapter_id>.md。
- 默认输出：manuscript/chapters/<chapter_id>.plan.md。

步骤：
1) 解析参数：chapter_id（如 ch0001）。
2) 默认执行类型画像流程（除非显式 --skip-profile）：
   - 若 .opencode/novel/profile.md 缺失或过旧，执行六维分类 + profile-aggregator（compact）。
   - 若显式 --skip-profile，必须在输出中记录 profile=none。
3) 调用 tool: novel_context_pack（task=draft，chapter_id=目标章节）。
4) 调用 skill: novel-oracle 或 novel-timeline-keeper（优先消费 profile）。
5) 输出章节计划到 .plan.md；若用户要求覆盖，先提示风险并建议先 /novel-snapshot。`;
