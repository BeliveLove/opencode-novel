export const NOVEL_CHAPTER_PLAN_TEMPLATE = `目标：生成章节计划（场景列表、信息分配、伏笔推进点），默认写入新文件（不覆盖正文）。

步骤：
1) 解析参数：chapter_id（如 ch0001）
2) 调用 tool: novel_context_pack（task=draft；chapter_id=目标章）
3) 调用 skill: novel-oracle 或 novel-timeline-keeper
4) 输出章节计划（建议写入 manuscript/chapters/<chapter_id>.plan.md）。`;
