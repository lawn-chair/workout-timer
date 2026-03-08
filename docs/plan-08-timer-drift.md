# Plan 08: Timer Drift Correction

**Effort:** Low | **Impact:** Low-Medium | **Priority:** 8

## Problem

`useTimer.ts` drives the workout timer via `setInterval(tick, 1000)`:

```ts
intervalRef.current = setInterval(() => {
  tick()
}, 1000)
```

JavaScript's `setInterval` doesn't guarantee exactly 1000ms between invocations. It can drift due to:

- Main thread blocking (other JavaScript execution, layout, paint)
- Browser throttling in background tabs (Chrome throttles `setInterval` to 1s minimum, but can still drift)
- Low-power mode on mobile devices
- macOS App Nap when the window is not visible

Over a 30-minute workout (1800 ticks), drift of 5-10ms per tick accumulates to 9-18 seconds. For a fitness timer where precise intervals matter (especially during timed work/rest phases), this is noticeable.

## Solution

Replace the counter-decrement model with a wall-clock model. Store a `phaseStartedAt` timestamp and derive `timeRemaining` from `Date.now()`. The `setInterval` becomes a display refresh tick rather than the source of truth for time.

---

## Approach

Two options, from simplest to most accurate:

### Option A: Drift correction (recommended — minimal change)

Keep the current architecture but correct for drift each tick. Instead of blindly decrementing by 1, calculate how much time has actually elapsed:

```ts
// src/lib/timer/useTimer.ts
import { useEffect, useRef } from 'react'
import { useTimerStore } from './store'

export function useTimer() {
  const { tick, isRunning, phase } = useTimerStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickRef = useRef<number>(Date.now())

  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'complete') {
      lastTickRef.current = Date.now()

      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = now - lastTickRef.current

        // If more than 1 second has passed, fire multiple ticks
        // This handles browser throttling and tab backgrounding
        const ticksToFire = Math.max(1, Math.floor(elapsed / 1000))

        for (let i = 0; i < ticksToFire; i++) {
          tick()
        }

        lastTickRef.current = now
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, phase, tick])
}
```

This catches up missed ticks (e.g., if the browser throttled and 3 seconds passed, it fires 3 ticks). The store's `tick()` function handles phase transitions correctly for each call.

**Pros:** Minimal change to existing architecture. Store logic unchanged.
**Cons:** Still counter-based internally. Very long background periods may fire many ticks at once.

### Option B: Wall-clock model (more invasive)

Add a `phaseStartedAt: number` field to the timer state. The `timeRemaining` is derived from `phaseDuration - (Date.now() - phaseStartedAt)` each render. The interval just triggers re-renders, not state mutations.

This requires changes to the store, types, and all phase transition logic. More accurate but significantly more work. Only worth it if Option A proves insufficient.

---

## Recommendation

Go with **Option A**. It's a 10-line change to `useTimer.ts` that fixes the practical problem (accumulated drift over a workout session). The catch-up loop handles the common cases: browser throttling, tab backgrounding, and CPU load.

Option B is only needed if you want sub-second accuracy (e.g., displaying milliseconds), which this app doesn't.

---

## Edge Case: Tab Backgrounding

When a tab is backgrounded, browsers throttle timers aggressively. Chrome may reduce `setInterval` to once per minute for background tabs. With Option A, when the user returns to the tab, the first tick will fire `Math.floor(elapsedMs / 1000)` catch-up ticks. This means phase transitions that happened while backgrounded will be processed in a burst.

This is correct behavior — the timer "catches up" to real time. But it means the user may return to find themselves several exercises ahead. This is inherent to any timer that doesn't use service workers or Web Workers for background execution.

If precise background timing is needed later, consider running `tick()` in a Web Worker. But for now, the catch-up model is sufficient.

---

## Files Changed

| File                        | Change                                                  |
| --------------------------- | ------------------------------------------------------- |
| `src/lib/timer/useTimer.ts` | Add drift correction with `Date.now()` + catch-up ticks |

---

## Testing

Add a test in `useTimer.test.tsx`:

```ts
it('fires multiple ticks to catch up after elapsed time', () => {
  // Mock Date.now to simulate 3 seconds passing in one interval
  // Verify tick() is called 3 times
})
```
