import { z } from "zod"

export const NovelConfigSchema = z.object({
  manuscriptDir: z.string().default("manuscript"),
})

export type NovelConfig = z.infer<typeof NovelConfigSchema>

