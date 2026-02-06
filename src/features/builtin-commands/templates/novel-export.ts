export const NOVEL_EXPORT_TEMPLATE = `目标：导出编译（md/html/epub/docx）。
步骤：
1) 如果用户提供 format（md|html|epub|docx），就使用该格式；否则省略 format，让 tool 按 config.export.formats 导出。
2) 如果用户指定了 DOCX 模板（default|manuscript），且导出格式包含 docx，则传 docxTemplate。
3) 调用 tool: novel_export { format?, docxTemplate? }
4) 输出 outputPath / outputs、docxTemplate（若存在）与统计。`;
