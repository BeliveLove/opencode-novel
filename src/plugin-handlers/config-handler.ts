import type { AgentConfig } from "@opencode-ai/sdk";
import { createNovelAgents } from "../agents";
import type { NovelConfig } from "../config/schema";

type OpenCodeConfig = Record<string, unknown> & {
  model?: unknown;
  agent?: Record<string, unknown>;
};

type PermissionConfig = NonNullable<AgentConfig["permission"]>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function mergeBooleanRecord(
  base: Record<string, boolean>,
  patch: Record<string, unknown>,
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (typeof v === "boolean") out[k] = v;
  }
  return out;
}

function applyAgentOverride(
  base: AgentConfig,
  override: Record<string, unknown> | undefined,
): AgentConfig {
  if (!override) return base;

  const next: AgentConfig = { ...base };

  if (typeof override.model === "string") next.model = override.model;
  if (typeof override.temperature === "number") next.temperature = override.temperature;
  if (typeof override.top_p === "number") next.top_p = override.top_p;
  if (typeof override.maxTokens === "number") next.maxTokens = override.maxTokens;

  if (typeof override.prompt === "string") next.prompt = override.prompt;
  if (typeof override.prompt_append === "string") {
    const current = typeof next.prompt === "string" ? next.prompt : "";
    next.prompt =
      current.length > 0 ? `${current}\n\n${override.prompt_append}` : override.prompt_append;
  }

  if (isRecord(override.tools)) {
    const currentTools = isRecord(next.tools) ? (next.tools as Record<string, unknown>) : {};
    next.tools = mergeBooleanRecord({}, currentTools);
    next.tools = mergeBooleanRecord(next.tools, override.tools);
  }

  if (isRecord(override.permission)) {
    if (typeof override.permission.edit === "string") {
      next.permission = next.permission ?? {};
      next.permission.edit = override.permission.edit as PermissionConfig["edit"];
    }
    if (typeof override.permission.webfetch === "string") {
      next.permission = next.permission ?? {};
      next.permission.webfetch = override.permission.webfetch as PermissionConfig["webfetch"];
    }
    if (typeof override.permission.doom_loop === "string") {
      next.permission = next.permission ?? {};
      next.permission.doom_loop = override.permission.doom_loop as PermissionConfig["doom_loop"];
    }
    if (typeof override.permission.external_directory === "string") {
      next.permission = next.permission ?? {};
      next.permission.external_directory = override.permission
        .external_directory as PermissionConfig["external_directory"];
    }
    if (typeof override.permission.bash === "string" || isRecord(override.permission.bash)) {
      next.permission = next.permission ?? {};
      next.permission.bash = override.permission.bash as PermissionConfig["bash"];
    }
  }

  return next;
}

export function createConfigHandler(deps: { pluginConfig: NovelConfig }) {
  const { pluginConfig } = deps;

  return async (config: OpenCodeConfig): Promise<void> => {
    if (pluginConfig.agents_enabled === false) {
      return;
    }

    const prefix = pluginConfig.agent_name_prefix ?? "novel-";
    const preset = pluginConfig.agents_preset ?? "core";
    const disabled = new Set((pluginConfig.disabled_agents ?? []).map((s) => s.toLowerCase()));
    const forceOverride = pluginConfig.agents_force_override ?? false;

    const modelFromUi = typeof config.model === "string" ? (config.model as string) : "";

    const agents = createNovelAgents({ preset, model: modelFromUi });

    const existing = isRecord(config.agent) ? (config.agent as Record<string, unknown>) : {};
    const merged: Record<string, unknown> = { ...existing };

    for (const [baseName, agentConfig] of Object.entries(agents)) {
      if (disabled.has(baseName.toLowerCase())) continue;
      const name = `${prefix}${baseName}`;
      const override = pluginConfig.agents?.[name];
      const finalAgent = applyAgentOverride(agentConfig, isRecord(override) ? override : undefined);

      if (!forceOverride && Object.hasOwn(existing, name)) {
        continue;
      }
      merged[name] = finalAgent;
    }

    config.agent = merged;
  };
}
