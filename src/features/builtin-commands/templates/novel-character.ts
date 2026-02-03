export const NOVEL_CHARACTER_TEMPLATE = `目标：生成/更新角色卡（manuscript/characters/<id>.md）。

步骤：
1) 解析参数：角色 id（如 char-zhangsan）
2) 调用 tool: novel_context_pack（task=review；chapter_id 可选）
3) 调用 skill: novel-character-expert
4) 将建议写入对应角色卡（不改章节正文）
5) 运行 /novel-index 更新索引（可选）。`;
