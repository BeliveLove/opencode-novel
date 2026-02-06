export const NOVEL_CHAPTER_REVIEW_TEMPLATE = `目标：输出审稿问题清单 + 修改方案（引用定位、最小改动）。
硬约束：
- 本命令默认只输出建议，不直接改写正文文件。

步骤：
1) 优先读取 .opencode/novel/profile.md 作为偏离基线；不存在时自动补跑 compact 画像。
2) 调用 tool: novel_context_pack（task=review，chapter_id=目标）。
3) 调用 skill: novel-flaw-finder（必须引用 profile.version 或声明 profile=none）。
4) 如需一致性维度：再调用 tool: novel_continuity_check（scope=chapter）。
5) 输出：问题清单（P0/P1/P2）+ 建议修改点位。`;
