import type { AgentConfig } from "@opencode-ai/sdk"

function expertBase(options: { model: string; description: string; prompt: string; temperature?: number }): AgentConfig {
  return {
    mode: "subagent",
    model: options.model || undefined,
    temperature: options.temperature ?? 0.3,
    description: options.description,
    permission: { edit: "deny", bash: "deny", webfetch: "deny" },
    prompt: options.prompt,
  } satisfies AgentConfig
}

export function createNovelOracleAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "结构诊断与改造顾问（Oracle）。",
    prompt: "你是小说结构顾问。输出：Assumptions/Findings/Recommendations(P0-P2)/Questions/Files To Update。",
    temperature: 0.25,
  })
}

export function createNovelEntityExtractorAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "实体候选抽取器（输出 candidates JSON）。",
    prompt:
      "你是实体候选抽取器。必须输出 NovelCandidatesV1 的 JSON（在 ```json 代码块中），并避免编造事实。",
    temperature: 0.2,
  })
}

export function createNovelCharacterExpertAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "人物画像与关系梳理专家。",
    prompt:
      "你是人物画像专家。输出：Assumptions/Findings/Recommendations(P0-P2)/Questions/Files To Update。",
    temperature: 0.35,
  })
}

export function createNovelFactionRelationsAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "势力关系与权力结构专家（Mermaid）。",
    prompt:
      "你是势力关系专家。输出 Mermaid 建议与可落盘字段建议（factions/*.md）。",
    temperature: 0.35,
  })
}

export function createNovelWorldbibleKeeperAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "世界观条款与名词表维护者。",
    prompt: "你是世界观维护者。整理规则条款（R-001…）与名词表，并指出自洽风险。",
    temperature: 0.25,
  })
}

export function createNovelTimelineKeeperAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "时间线梳理专家。",
    prompt: "你是时间线专家。定位时间矛盾并给最小改动修复建议（frontmatter.timeline）。",
    temperature: 0.25,
  })
}

export function createNovelContinuitySentinelAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "一致性修复路径专家（基于报告）。",
    prompt: "你是一致性修复专家。以 CONTINUITY_REPORT 为依据给最小修复路径。",
    temperature: 0.2,
  })
}

export function createNovelForeshadowingUnresolvedAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "伏笔/承诺回收方案专家。",
    prompt: "你是伏笔回收专家。按线程给回收落点建议与 close_plan。",
    temperature: 0.3,
  })
}

export function createNovelFlawFinderAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "缺点发现与修复建议专家。",
    prompt: "你是缺点发现专家。输出问题清单与优先级修复方案。",
    temperature: 0.35,
  })
}

export function createNovelContinuationExpertAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "续写与承接写作专家。",
    prompt: "你是续写专家。保持人设/语气/世界观一致，可给 A/B 分支。",
    temperature: 0.7,
  })
}

export function createNovelPolishExpertAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "润色与改写专家（保守/重写）。",
    prompt: "你是润色专家。给 conservative/rewrite 两档输出，默认写新文件。",
    temperature: 0.45,
  })
}

export function createNovelSummaryExpertAgent(model: string): AgentConfig {
  return expertBase({
    model,
    description: "摘要与卖点提炼专家。",
    prompt: "你是摘要专家。给无剧透/含剧透摘要，并建议写入 frontmatter.summary。",
    temperature: 0.3,
  })
}

