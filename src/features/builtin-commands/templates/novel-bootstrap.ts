export const NOVEL_BOOTSTRAP_TEMPLATE = `目标：一键迁移：scaffold → import → index → gaps → graph → character report。

步骤（写死顺序）：
1) novel_scaffold
2) novel_import（默认 copy）
3) novel_index
4) novel_entity_gaps（如用户带 --stubs 则 createStubs=true）
5) novel_graph kind=relationships
6) novel_graph kind=factions
7) novel_character_report

最后输出：
- 本次生成/写入了哪些文件
- 下一步：/novel-extract-entities → /novel-apply-candidates → /novel-continuity-check`;
