export const NOVEL_GRAPH_TEMPLATE = `目标：生成 Mermaid 图（relationships 或 factions）。

步骤：
1) 解析用户参数 kind（relationships|factions）
2) 调用 tool: novel_graph { kind }
3) 输出 graphPath 与统计。`

