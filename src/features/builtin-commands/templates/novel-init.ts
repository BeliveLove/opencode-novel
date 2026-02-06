export const NOVEL_INIT_TEMPLATE = `目标：从 0 创建可运行小说工程，并强制生成首版类型画像（profile）。

步骤（必须按顺序执行）：
1) 调用 tool: novel_scaffold
   - args: { bookTitle: $ARGUMENTS, writeConfigJsonc: true, writeTemplates: true }
2) 执行六维标签判定（默认 compact）：
   - 依次调用 skill：genre-classifier / trope-classifier / audience-classifier / emotion-classifier / structure-classifier / market-tagger
   - 输入来源优先级：用户参数 > 已有书设/大纲 > 章节摘要 > 标题兜底推断
3) 调用 skill: profile-aggregator
   - 输出写入：.opencode/novel/profile.md
   - 若低置信度维度不足，写入 missingDomains，不得阻断初始化
4) 输出下一步建议（自动给出最短链路）：
   - /novel-index
   - /novel-chapter-plan ch0001

约束：
- 不要修改任何既有正文（如果已经存在 manuscript/）。
- 非高危操作不需要用户额外交互；仅覆盖原章/删改事实源时二次确认。`;
