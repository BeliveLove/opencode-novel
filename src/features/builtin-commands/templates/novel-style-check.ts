export const NOVEL_STYLE_CHECK_TEMPLATE = `目标：风格一致性报告（STYLE_REPORT.md）。
步骤：
1) 识别 scope（all/chapter/character），并按需设置口癖阈值参数。
2) 调用 tool: novel_style_check { scope?, catchphraseMaxCount?, catchphraseReportMissing? }
3) 输出偏差条目、统计与修复建议。`;
