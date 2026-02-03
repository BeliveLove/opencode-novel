export const NOVEL_INIT_TEMPLATE = `目标：从 0 创建一个可用小说工程（事实源 + 派生目录 + 最小配置）。

步骤（必须按顺序执行）：
1) 调用 tool: novel_scaffold
   - args: { bookTitle: $ARGUMENTS, writeConfigJsonc: true, writeTemplates: true }
2) 提示下一步建议：
   - 运行 /novel-index
   - 创建第 1 章计划：/novel-chapter-plan ch0001

约束：
- 不要修改任何既有正文（如果已经存在 manuscript/）。`

