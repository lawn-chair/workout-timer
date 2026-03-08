# Plan 07: Wire Up Audio Settings

**Effort:** Low | **Impact:** Medium | **Priority:** 4

## Problem

The settings page (`src/app/settings/page.tsx`) renders four audio toggles:

- Countdown Beeps
- Work Start Sound
- Rest Start Sound
- Completion Chime

These values are saved to the database via `/api/settings`. But `useTimerAudio.ts` calls `audioManager.playCountdown()` etc. **unconditionally** — it never reads the user's audio preferences.

The `AudioManager` class in `src/lib/timer/audio.ts` has a single `setEnabled(boolean)` method — a global on/off toggle, not per-sound-type controls.

**Result:** The four audio setting toggles are non-functional. Toggling them, saving, and running a workout has zero effect on audio behavior.

## Solution

Load the user's audio settings into the timer context and check the relevant flag before each audio call in `useTimerAudio`. No changes to `AudioManager` needed — the conditional logic goes in the hook.

---

## Step-by-Step Changes

### 1. Pass audio settings to `useTimerAudio`

The simplest approach: `useTimerAudio` accepts audio preferences as a parameter.

```ts
// src/lib/timer/useTimerAudio.ts
import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/lib/timer/store'
import { audioManager } from './audio'
import { TimerPhase } from './types'

interface AudioPreferences {
  countdownBeeps: boolean
  workStartSound: boolean
  restStartSound: boolean
  completionChime: boolean
}

const defaultPrefs: AudioPreferences = {
  countdownBeeps: true,
  workStartSound: true,
  restStartSound: true,
  completionChime: true,
}

export function useTimerAudio(prefs: AudioPreferences = defaultPrefs) {
  const { phase, timeRemaining, isRunning } = useTimerStore()
  const prevPhaseRef = useRef<TimerPhase>('idle')
  const prevTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isRunning) return

    if (phase !== prevPhaseRef.current) {
      switch (phase) {
        case 'countdown':
          if (prefs.countdownBeeps) audioManager.playCountdown()
          break
        case 'work':
          if (prefs.workStartSound) audioManager.playWorkStart()
          break
        case 'rest':
        case 'restBetweenSets':
          if (prefs.restStartSound) audioManager.playRestStart()
          break
        case 'complete':
          if (prefs.completionChime) audioManager.playComplete()
          break
      }
      prevPhaseRef.current = phase
    }

    // Countdown beeps at 3, 2, 1 seconds remaining
    if (
      prefs.countdownBeeps &&
      timeRemaining <= 3 &&
      timeRemaining > 0 &&
      timeRemaining !== prevTimeRef.current
    ) {
      audioManager.playCountdown()
    }

    prevTimeRef.current = timeRemaining
  }, [phase, timeRemaining, isRunning, prefs])
}
```

### 2. Load settings in the timer page

The timer page needs to read the user's audio settings. Two options:

**Option A (recommended): Read from localStorage/cache**

If Plan 06 (settings Zod) and Plan 04 (TanStack Query) are implemented, use the TanStack Query cache:

```tsx
// src/app/timer/page.tsx
import { useQuery } from '@tanstack/react-query'
import { fetchUserSettings } from '@/lib/workout/api'

export default function TimerPage() {
  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchUserSettings,
    staleTime: Infinity, // Settings rarely change mid-session
  })

  useTimerAudio({
    countdownBeeps: settings?.countdownBeeps ?? true,
    workStartSound: settings?.workStartSound ?? true,
    restStartSound: settings?.restStartSound ?? true,
    completionChime: settings?.completionChime ?? true,
  })

  // ... rest unchanged
}
```

**Option B (standalone, no TanStack Query dependency): Fetch once on mount**

```tsx
// src/app/timer/page.tsx
import { useEffect, useState } from 'react'
import { fetchUserSettings } from '@/lib/workout/api'

export default function TimerPage() {
  const [audioPrefs, setAudioPrefs] = useState({
    countdownBeeps: true,
    workStartSound: true,
    restStartSound: true,
    completionChime: true,
  })

  useEffect(() => {
    fetchUserSettings()
      .then((s) =>
        setAudioPrefs({
          countdownBeeps: s.countdownBeeps ?? true,
          workStartSound: s.workStartSound ?? true,
          restStartSound: s.restStartSound ?? true,
          completionChime: s.completionChime ?? true,
        })
      )
      .catch(() => {}) // Keep defaults on error
  }, [])

  useTimerAudio(audioPrefs)

  // ... rest unchanged
}
```

Option B works without any other plan dependency and is fine for this use case (settings are fetched once when the timer starts and don't change during a workout).

### 3. Consider removing `AudioManager.setEnabled()`

The global `setEnabled(boolean)` method on `AudioManager` is no longer the right abstraction. Per-sound-type control is now handled in the hook. The `setEnabled` method can be kept as a master mute toggle (e.g., for a "mute all" button) or removed entirely.

If keeping it, ensure the hook also checks the master toggle:

```ts
// In useTimerAudio:
if (prefs.countdownBeeps && audioManager.isEnabled()) {
  audioManager.playCountdown()
}
```

But since nothing currently calls `setEnabled(false)`, this is a no-op. Safe to ignore for now.

---

## Files Changed

| File                             | Change                                                     |
| -------------------------------- | ---------------------------------------------------------- |
| `src/lib/timer/useTimerAudio.ts` | Accept `AudioPreferences` param, conditionally play sounds |
| `src/app/timer/page.tsx`         | Load user settings, pass to `useTimerAudio`                |

---

## Testing

After this change:

1. Go to Settings, disable "Countdown Beeps", save
2. Start a workout — 3-2-1 countdown should be silent
3. Work phase should still have its chime (if workStartSound is on)
4. Re-enable all sounds, start workout — all audio cues should play

Existing `useTimerAudio.test.tsx` will need updated to pass prefs. Default prefs (all true) should preserve existing behavior.
