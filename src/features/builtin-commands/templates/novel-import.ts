export const NOVEL_IMPORT_TEMPLATE = `目标：不改原文，把已有目录导入为 manuscript/ 标准结构。

步骤：
1) 调用 tool: novel_import（默认 mode=copy；fromDir 默认当前目录）
2) 如 diagnostics 有 error：提示用户修复或改用 mode=analyze
3) 成功后提示下一步：
   - /novel-index
   - /novel-entities-audit --stubs

约束：
- 严禁修改 fromDir 下原始文件（只读）。`;
