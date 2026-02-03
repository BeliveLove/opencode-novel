export const NOVEL_STYLE_GUIDE_TEMPLATE = `目标：生成/更新全局写作约束（styleGuide）。

建议流程：
1) 调用 tool: novel_context_pack（task=review；budget 使用 config.contextPack.maxChars）
2) 调用 skill: novel-oracle 或 novel-flaw-finder，产出“全局风格约束建议”
3) 将建议写入项目级 .opencode/novel.jsonc 的 styleGuide 字段（只改配置，不改正文）

输出要求：
- 给出可直接复制的 JSONC 片段（styleGuide）。`

