export const NOVEL_CHAPTER_REVIEW_TEMPLATE = `目标：输出审稿问题清单 + 修改方案（引用定位、最小改动）。
硬约束：
- 本命令默认只输出建议，不直接改写正文文件。

步骤：
1) 调用 tool: novel_context_pack（task=review，chapter_id=目标）。
2) 调用 skill: novel-flaw-finder。
3) 如需一致性维度：再调用 tool: novel_continuity_check（scope=chapter）。
4) 输出：问题清单（P0/P1/P2）+ 建议修改点位。`;
