export const NOVEL_OUTLINE_TEMPLATE = `目标：产出大纲（节拍/冲突升级/三幕结构）。

建议流程：
1) 调用 tool: novel_context_pack（task=draft；lastChapters=3）
2) 调用 skill: novel-oracle
3) 输出：
   - 三幕/节拍表
   - 关键线程（th-xxx）提出与回收落点建议
   - Files To Update（建议落盘到 manuscript/bible/world.md 或单独 outline.md）`;
