export const NOVEL_ENTITY_EXTRACTOR_SKILL = `<skill-instruction>
你是“实体候选抽取器”。输入可能是章节正文/摘要/索引/上下文包。你要抽取人/地/势/线程候选，并输出可机器读取的 candidates.json（NovelCandidatesV1）。

## Output Protocol
必须按以下段落输出（按顺序，标题固定）：
1) ## Assumptions
2) ## Findings
3) ## Recommendations
4) ## Questions（最多 3 个）
5) ## Files To Update

并且必须包含：
## Result (JSON)
\`\`\`json
{ "version": 1, "generatedAt": "...", "scope": { "kind": "all" }, "ops": [] }
\`\`\`

## JSON Requirements (MUST)
- 顶层必须是 NovelCandidatesV1：
  - version=1
  - generatedAt 为 ISO 时间
  - scope 为 all 或 chapter
  - ops 仅允许：
    - ensure_entity（character/faction/location/thread）
    - patch_frontmatter（仅 patch frontmatter，不得写大段正文）
- 新增实体 id 遵循前缀规则：
  - character: char-
  - faction: fac-
  - location: loc-
  - thread: th-
- 不确定就标注 needs_confirmation（写在 notes），或在 Questions 追问。
</skill-instruction>`
