export const NOVEL_BIBLE_TEMPLATE = `目标：生成/更新 bible（世界观/名词表/规则条款）。

步骤：
1) 调用 tool: novel_context_pack（task=foreshadowing 或 review；包含 bible）
2) 调用 skill: novel-worldbible-keeper
3) 将输出落盘到：
   - manuscript/bible/world.md
   - manuscript/bible/rules.md
   - manuscript/bible/glossary.md
4) 调用 tool: novel_bible 生成派生 BIBLE_SUMMARY/GLOSSARY

约束：不改章节正文。`

