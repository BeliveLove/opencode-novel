export const NOVEL_ENTITIES_AUDIT_TEMPLATE = `目标：实体缺口盘点（可选补 stub），写入 ENTITY_GAPS.md。

步骤：
1) 调用 tool: novel_entity_gaps（默认只报告；如用户带 --stubs 则 createStubs=true）
2) 输出：missing/orphans 摘要 + 下一步建议（/novel-index、/novel-continuity-check）。`;
