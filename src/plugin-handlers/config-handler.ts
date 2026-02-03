import type { AgentConfig } from "@opencode-ai/sdk"
import type { NovelConfig } from "../config/schema"
import { createNovelAgents } from "../agents"

type OpenCodeConfig = Record<string, unknown> & {
  model?: unknown
  agent?: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function mergeRecord<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
  return { ...(base as Record<string, unknown>), ...(patch as Record<string, unknown>) } as T
}

function applyAgentOverride(base: AgentConfig, override: Record<string, unknown> | undefined): AgentConfig {
  if (!override) return base

  const next: AgentConfig = { ...base }

  if (typeof override.model === "string") next.model = override.model
  if (typeof override.temperature === "number") next.temperature = override.temperature
  if (typeof override.top_p === "number") (next as any).top_p = override.top_p
  if (typeof override.maxTokens === "number") (next as any).maxTokens = override.maxTokens

  if (typeof override.prompt === "string") next.prompt = override.prompt
  if (typeof override.prompt_append === "string") {
    const current = typeof next.prompt === "string" ? next.prompt : ""
    next.prompt = current.length > 0 ? `${current}\n\n${override.prompt_append}` : override.prompt_append
  }

  if (isRecord(override.tools)) {
    const currentTools = isRecord(next.tools) ? (next.tools as Record<string, boolean>) : {}
    next.tools = mergeRecord(currentTools, override.tools) as any
  }

  if (isRecord(override.permission)) {
    const currentPerm = isRecord(next.permission) ? (next.permission as Record<string, unknown>) : {}
    next.permission = mergeRecord(currentPerm, override.permission) as any
  }

  return next
}

export function createConfigHandler(deps: { pluginConfig: NovelConfig }) {
  const { pluginConfig } = deps

  return async (config: OpenCodeConfig): Promise<void> => {
    if (pluginConfig.agents_enabled === false) {
      return
    }

    const prefix = pluginConfig.agent_name_prefix ?? "novel-"
    const preset = pluginConfig.agents_preset ?? "core"
    const disabled = new Set((pluginConfig.disabled_agents ?? []).map((s) => s.toLowerCase()))
    const forceOverride = pluginConfig.agents_force_override ?? false

    const modelFromUi = typeof config.model === "string" ? (config.model as string) : ""

    const agents = createNovelAgents({ preset, model: modelFromUi })

    const existing = isRecord(config.agent) ? (config.agent as Record<string, unknown>) : {}
    const merged: Record<string, unknown> = { ...existing }

    for (const [baseName, agentConfig] of Object.entries(agents)) {
      if (disabled.has(baseName.toLowerCase())) continue
      const name = `${prefix}${baseName}`
      const override = pluginConfig.agents?.[name]
      const finalAgent = applyAgentOverride(agentConfig, isRecord(override) ? override : undefined)

      if (!forceOverride && Object.prototype.hasOwnProperty.call(existing, name)) {
        continue
      }
      merged[name] = finalAgent
    }

    config.agent = merged
  }
}
