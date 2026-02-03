import type { NovelConfig } from "./schema"
import { NovelConfigSchema } from "./schema"

export function createDefaultNovelConfig(projectRoot: string): NovelConfig {
  const base = NovelConfigSchema.parse({})
  return { ...base, projectRoot }
}

