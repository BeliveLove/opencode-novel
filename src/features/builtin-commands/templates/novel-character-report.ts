export const NOVEL_CHARACTER_REPORT_TEMPLATE = `目标：生成人物曲线/出场统计（CHARACTER_REPORT.md）。

原则：
- 本命令默认“自驱闭环”：报告为空会自动尝试补齐事实源，再复跑验证。
- 只有在真正写入 manuscript/（dryRun=false）前才需要用户确认。

步骤：
1) 调用 tool: novel_character_report
2) 若 resultJson.characters 为空：
   2.1) 调用 tool: novel_entity_gaps { createStubs:true }（仅基于已有引用补 stub；不改正文）
   2.2) 复跑 tool: novel_character_report
3) 若仍为空（通常是章节 frontmatter 未标注 characters/threads 等结构化信息）：
   3.1) 调用 tool: novel_context_pack（task=continuity；若 scope=all 内容过长则按 chapter_id 分批）
   3.2) 调用 skill: novel-entity-extractor（必须输出 NovelCandidatesV1）
   3.3) 调用 tool: novel_candidates_write（把 Result(JSON) 写入 candidates.json）
   3.4) 调用 tool: novel_apply_candidates（dryRun=true）
   3.5) 展示 APPLY_REPORT 摘要与将写入的文件列表，并询问是否执行 dryRun=false
   3.6) 用户确认后再次调用 novel_apply_candidates { dryRun:false }
   3.7) 调用 tool: novel_index（刷新 INDEX/TIMELINE 等派生）
   3.8) 最后复跑 tool: novel_character_report
4) 输出 reportPath + 缺失字段提醒（严格以 tool 输出为准，不要臆造字段）。`;
