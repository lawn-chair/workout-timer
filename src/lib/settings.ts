import { z } from 'zod'

export const SettingsSchema = z.object({
  countdownBeeps: z.boolean().default(true),
  workStartSound: z.boolean().default(true),
  restStartSound: z.boolean().default(true),
  completionChime: z.boolean().default(true),
  theme: z.enum(['dark', 'light', 'system']).default('system'),
  accessibility: z
    .enum(['default', 'high-contrast', 'large-text'])
    .default('default'),
})

export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings: Settings = SettingsSchema.parse({})

/**
 * Parse settings from DB or API. Returns valid settings with defaults
 * for missing/invalid fields. Never throws.
 */
export function parseSettings(raw: unknown): Settings {
  const result = SettingsSchema.safeParse(raw ?? {})
  return result.success ? result.data : defaultSettings
}
