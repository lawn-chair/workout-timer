# Plan 02: Timer State Persistence

**Effort:** Low | **Impact:** Medium | **Priority:** 5

## Problem

The timer Zustand store (`src/lib/timer/store.ts`) holds all state in memory. If the user refreshes mid-workout, all state is lost and they're redirected to the home page. This is particularly painful mid-session.

## Solution

Add Zustand's built-in `persist` middleware with `localStorage` as the storage backend. This requires zero new dependencies — Zustand 5 ships persist middleware out of the box.

**Critical:** Zustand persist rehydrates asynchronously. The timer page redirects to `/` when `workout` is null. Without a hydration guard, the first render sees null (initial state), triggers the redirect, and the persisted state never loads. This must be handled explicitly.

---

## Step-by-Step Changes

### 1. `src/lib/timer/store.ts`

Wrap the store with `persist`:

```diff
-import { create } from 'zustand'
+import { create } from 'zustand'
+import { persist, createJSONStorage } from 'zustand/middleware'
 import {
   TimerState,
   TimerPhase,
   Workout,
   WorkoutSet,
   SetExercise,
 } from './types'
```

Change the `create` call:

```diff
-export const useTimerStore = create<TimerState>((set, get) => ({
+export const useTimerStore = create<TimerState>()(
+  persist(
+    (set, get) => ({
       workout: null,
       phase: 'idle',
       currentSetIndex: 0,
       currentExerciseIndex: 0,
       currentRepeat: 1,
       timeRemaining: 0,
       totalTimeElapsed: 0,
       isRunning: false,

       loadWorkout: (workout: Workout) => { ... },
       start: () => { ... },
       pause: () => set({ isRunning: false }),
       resume: () => set({ isRunning: true }),
       skip: () => { ... },
       stop: () => { ... },
       tick: () => { ... },
-}))
+    }),
+    {
+      name: 'timer-state',
+      storage: createJSONStorage(() => localStorage),
+      partialize: (state) => ({
+        workout: state.workout,
+        phase: state.phase,
+        currentSetIndex: state.currentSetIndex,
+        currentExerciseIndex: state.currentExerciseIndex,
+        currentRepeat: state.currentRepeat,
+        timeRemaining: state.timeRemaining,
+        totalTimeElapsed: state.totalTimeElapsed,
+        // Note: isRunning is intentionally excluded — always restore as paused
+      }),
+    }
+  )
+)
```

By excluding `isRunning` from `partialize`, the store always restores with `isRunning: false` (the initial value). This is simpler and more reliable than `onRehydrateStorage` mutation.

### 2. `src/app/timer/page.tsx` — Add hydration guard (CRITICAL)

The current timer page redirects when `workout` is null:

```ts
// Current code — will race with persist rehydration
useEffect(() => {
  if (!workout) router.push('/')
}, [workout, router])
```

Zustand persist rehydrates asynchronously. On the first render after a refresh, `workout` is `null` (the Zustand initial state). The `useEffect` fires the redirect before `localStorage` data loads. The user is kicked to `/` every time.

**Fix:** Wait for hydration before acting on store state.

```tsx
import { useEffect, useState } from 'react'

export default function TimerPage() {
  const router = useRouter()
  const { phase, workout, isRunning } = useTimerStore()
  const [hydrated, setHydrated] = useState(false)

  // Wait for Zustand persist to rehydrate from localStorage
  useEffect(() => {
    const unsub = useTimerStore.persist.onFinishHydration(() => {
      setHydrated(true)
    })
    // If already hydrated (e.g., navigated from home page, not a refresh)
    if (useTimerStore.persist.hasHydrated()) {
      setHydrated(true)
    }
    return unsub
  }, [])

  // Only redirect after hydration confirms there's no persisted workout
  useEffect(() => {
    if (hydrated && !workout) {
      router.push('/')
    }
  }, [hydrated, workout, router])

  useTimer()
  useTimerAudio()
  const { isSupported: wakeLockSupported } = useWakeLock(
    isRunning && phase !== 'idle' && phase !== 'complete'
  )

  // Show loading until hydrated
  if (!hydrated || !workout) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-5">
          <StatePanel
            eyebrow="Loading"
            title="Preparing the timer"
            description="Pulling your workout data."
          />
        </div>
      </AppShell>
    )
  }

  // ... rest of the component unchanged
}
```

### 3. Clean up persisted state on workout complete

When the user finishes a workout and clicks "Back to Workouts", the `stop()` action resets the store to idle. Since `phase: 'idle'` and `workout` remain in localStorage, a stale workout object will persist. Add cleanup in the "Back to Workouts" handler:

```ts
const handleComplete = () => {
  stop() // resets phase to idle, clears timer state
  router.push('/')
}
```

`stop()` already sets `phase: 'idle'` which is fine — the timer page's hydration guard will see `workout` is still set but `phase` is idle. Consider also nulling out the workout on stop:

```diff
  stop: () => {
    set({
+     workout: null,
      phase: 'idle',
      currentSetIndex: 0,
      ...
    })
  },
```

This way persisted state is fully cleaned up. The timer page redirect (`if (hydrated && !workout)`) handles this case.

---

## Files Changed

| File                     | Change                                                            |
| ------------------------ | ----------------------------------------------------------------- |
| `src/lib/timer/store.ts` | Wrap with `persist` middleware, `partialize` excludes `isRunning` |
| `src/app/timer/page.tsx` | Add hydration guard before redirect logic                         |

---

## Notes

- `zustand/middleware` is included in the `zustand` package — no extra install needed.
- `createJSONStorage(() => localStorage)` is the explicit way to configure localStorage storage. It also handles SSR safety (returns `undefined` if `localStorage` is unavailable).
- Excluding `isRunning` from `partialize` is simpler than mutating state in `onRehydrateStorage`. The user always sees a paused timer after refresh, which is the expected UX.
- The hydration guard adds ~10 lines to the timer page but prevents a real bug that would make persist useless.
