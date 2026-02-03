export const NOVEL_THREAD_TEMPLATE = `目标：创建/更新线程卡（manuscript/threads/<thread_id>.md），包含 close_plan。

步骤：
1) 解析参数：thread_id（如 th-001）
2) 调用 tool: novel_context_pack（task=foreshadowing）
3) 调用 skill: novel-foreshadowing-unresolved
4) 写入线程卡（补齐 opened_in/expected_close_by/close_plan）
5) 运行 /novel-foreshadowing-audit（可选）。`

