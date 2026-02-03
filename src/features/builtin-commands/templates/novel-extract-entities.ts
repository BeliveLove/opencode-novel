export const NOVEL_EXTRACT_ENTITIES_TEMPLATE = `目标：用 LLM 从正文/摘要/索引提出 candidates（不直接写回事实源）。

步骤（写死）：
1) 调用 tool: novel_context_pack（scope=chapter 时围绕该章；scope=all 时分批处理）
2) 调用 skill: novel-entity-extractor（必须输出 NovelCandidatesV1）
3) 将 Result(JSON) 写入 .opencode/novel/cache/candidates.json（覆盖写）
4) 提醒下一步：运行 /novel-apply-candidates（默认 dryRun=true）。`

