export const NOVEL_FACTION_TEMPLATE = `目标：生成/更新势力卡（manuscript/factions/<id>.md）。

步骤：
1) 解析参数：势力 id（如 fac-blackhand）
2) 调用 tool: novel_context_pack（task=review）
3) 调用 skill: novel-faction-relations
4) 写入势力卡（不改章节正文）
5) 可选：运行 /novel-graph factions。`

