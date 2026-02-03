import type { AgentConfig } from "@opencode-ai/sdk"
import type { NovelAgentBaseName } from "./types"
import { createNovelMuseAgent } from "./muse"
import { createNovelEditorAgent } from "./editor"
import { createNovelSentinelAgent } from "./sentinel"
import {
  createNovelCharacterExpertAgent,
  createNovelContinuitySentinelAgent,
  createNovelEntityExtractorAgent,
  createNovelFactionRelationsAgent,
  createNovelFlawFinderAgent,
  createNovelForeshadowingUnresolvedAgent,
  createNovelOracleAgent,
  createNovelPolishExpertAgent,
  createNovelSummaryExpertAgent,
  createNovelTimelineKeeperAgent,
  createNovelWorldbibleKeeperAgent,
  createNovelContinuationExpertAgent,
} from "./experts"

export type { NovelAgentBaseName } from "./types"

export function createNovelAgents(options: {
  preset: "core" | "full"
  model: string
}): Record<NovelAgentBaseName, AgentConfig> {
  const core = {
    muse: createNovelMuseAgent(options.model),
    editor: createNovelEditorAgent(options.model),
    sentinel: createNovelSentinelAgent(options.model),
  } satisfies Record<string, AgentConfig>

  if (options.preset === "core") {
    return core as Record<NovelAgentBaseName, AgentConfig>
  }

  return {
    ...core,
    oracle: createNovelOracleAgent(options.model),
    "entity-extractor": createNovelEntityExtractorAgent(options.model),
    "character-expert": createNovelCharacterExpertAgent(options.model),
    "faction-relations": createNovelFactionRelationsAgent(options.model),
    "worldbible-keeper": createNovelWorldbibleKeeperAgent(options.model),
    "timeline-keeper": createNovelTimelineKeeperAgent(options.model),
    "continuity-sentinel": createNovelContinuitySentinelAgent(options.model),
    "foreshadowing-unresolved": createNovelForeshadowingUnresolvedAgent(options.model),
    "flaw-finder": createNovelFlawFinderAgent(options.model),
    "continuation-expert": createNovelContinuationExpertAgent(options.model),
    "polish-expert": createNovelPolishExpertAgent(options.model),
    "summary-expert": createNovelSummaryExpertAgent(options.model),
  } as Record<NovelAgentBaseName, AgentConfig>
}

