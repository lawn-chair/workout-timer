# Plan 06: Settings Zod Validation

**Effort:** Low | **Impact:** Low | **Priority:** 7

## Problem

`settings Json?` on the `User` model is an untyped blob. The API reads and writes it without validation:

```ts
// src/app/api/settings/route.ts
const body = await request.json()
await prisma.user.update({ where: { id: user.id }, data: { settings: body } })
```

If the settings shape changes — new fields added, old fields renamed — existing data silently stays in the old shape. Components reading settings assume a structure that may not exist.

Additionally, the settings page (`src/app/settings/page.tsx`) defines its own inline `UserSettings` interface with defaults, duplicating the shape definition. The `fetchUserSettings()` return type is `Record<string, unknown>`, requiring unsafe casts.

## Solution

Add a Zod schema that validates (and migrates with defaults) settings on every read. Use `.catch()` for graceful fallback so old/malformed data never causes a 500.

No schema migration needed — `Json?` stays. This is a pure application-layer fix.

---

## Actual Settings Shape

From `src/app/settings/page.tsx` (lines 18-25), the app uses these fields:

```ts
interface UserSettings {
  countdownBeeps: boolean // 3-2-1 beeps before exercise starts
  workStartSound: boolean // Chime when work phase begins
  restStartSound: boolean // Chime when rest phase begins
  completionChime: boolean // Sound when workout is complete
  theme?: ThemeMode // 'dark' | 'light' | 'system'
  accessibility?: AccessibilityPreset // 'default' | 'high-contrast' | 'large-text'
}
```

---

## Step-by-Step Changes

### 1. Zod is already available

Zod is installed as a transitive dependency (via node_modules). Add it as a direct dependency:

```bash
npm install zod
```

### 2. Create `src/lib/settings.ts` — Settings schema

```ts
import { z } from 'zod'

export const SettingsSchema = z.object({
  // Audio preferences
  countdownBeeps: z.boolean().default(true),
  workStartSound: z.boolean().default(true),
  restStartSound: z.boolean().default(true),
  completionChime: z.boolean().default(true),

  // Appearance
  theme: z.enum(['dark', 'light', 'system']).default('system'),
  accessibility: z
    .enum(['default', 'high-contrast', 'large-text'])
    .default('default'),
})

export type Settings = z.infer<typeof SettingsSchema>

export const defaultSettings: Settings = SettingsSchema.parse({})

/**
 * Parse settings from database or API response.
 * Returns valid settings with defaults for missing/invalid fields.
 * Never throws — malformed data falls back to defaults.
 */
export function parseSettings(raw: unknown): Settings {
  const result = SettingsSchema.safeParse(raw ?? {})
  if (result.success) return result.data
  // If parsing fails entirely, return all defaults
  return defaultSettings
}
```

Using `safeParse` + fallback instead of `.catch()` gives us a cleaner API and avoids the Zod v4 `.catch()` signature differences.

### 3. `src/app/api/settings/route.ts` — Validate on read and write

**GET handler:**

```diff
+import { parseSettings } from '@/lib/settings'

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { settings: true },
  })

-  return NextResponse.json(dbUser?.settings || {})
+  return NextResponse.json(parseSettings(dbUser?.settings))
```

**PATCH handler:**

```diff
+import { parseSettings } from '@/lib/settings'

  const body = await request.json()
+  const settings = parseSettings(body)

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
-   data: { settings: body },
+   data: { settings: settings },
  })

-  return NextResponse.json(updatedUser.settings)
+  return NextResponse.json(parseSettings(updatedUser.settings))
```

On write, `parseSettings(body)` strips unknown keys and fills defaults. This prevents arbitrary JSON from being stored.

### 4. `src/lib/workout/api.ts` — Type the settings response

```diff
+import type { Settings } from '@/lib/settings'

-export async function fetchUserSettings(): Promise<Record<string, unknown>> {
+export async function fetchUserSettings(): Promise<Settings> {
```

### 5. `src/app/settings/page.tsx` — Use shared types

Remove the inline `UserSettings` interface and `defaultSettings` constant. Import from the shared module:

```diff
-interface UserSettings {
-  countdownBeeps: boolean
-  workStartSound: boolean
-  restStartSound: boolean
-  completionChime: boolean
-  theme?: ThemeMode
-  accessibility?: AccessibilityPreset
-}
-
-const defaultSettings: UserSettings = {
-  countdownBeeps: true,
-  workStartSound: true,
-  restStartSound: true,
-  completionChime: true,
-  theme: 'system',
-  accessibility: 'default',
-}
+import { type Settings, defaultSettings, parseSettings } from '@/lib/settings'
```

Update the state type:

```diff
-const [settings, setSettings] = useState<UserSettings>(defaultSettings)
+const [settings, setSettings] = useState<Settings>(defaultSettings)
```

Update the fetch handler:

```diff
  fetchUserSettings()
    .then((data) => {
-     const fetched = data as Partial<UserSettings>
-     setSettings({
-       ...defaultSettings,
-       ...fetched,
-       theme: fetched.theme || theme,
-       accessibility: fetched.accessibility || accessibility,
-     })
+     setSettings({
+       ...data,
+       theme: data.theme || theme,
+       accessibility: data.accessibility || accessibility,
+     })
      setLoading(false)
    })
```

The API now returns fully-validated settings with defaults, so the spread with `defaultSettings` is no longer needed.

Remove the `as unknown as Record<string, unknown>` cast in `handleSave`:

```diff
-  await updateUserSettings(settings as unknown as Record<string, unknown>)
+  await updateUserSettings(settings)
```

Update `updateUserSettings` signature:

```diff
-export async function updateUserSettings(
-  settings: Record<string, unknown>
-): Promise<Record<string, unknown>> {
+export async function updateUserSettings(
+  settings: Settings
+): Promise<Settings> {
```

---

## Files Changed

| File                            | Change                                                                 |
| ------------------------------- | ---------------------------------------------------------------------- |
| `package.json`                  | Add `zod` as direct dependency                                         |
| `src/lib/settings.ts`           | New: Zod schema, `Settings` type, `parseSettings()`, `defaultSettings` |
| `src/app/api/settings/route.ts` | Use `parseSettings()` on read and write                                |
| `src/lib/workout/api.ts`        | Type `fetchUserSettings` and `updateUserSettings` with `Settings`      |
| `src/app/settings/page.tsx`     | Remove inline types/defaults, import from `@/lib/settings`             |
