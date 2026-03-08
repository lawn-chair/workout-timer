# Plan 05: Consolidate Timer Display Logic

**Effort:** Medium | **Impact:** Medium | **Priority:** 6

> **Note:** This plan replaces the original "Timer as a Reducer / State Machine" plan. The reducer wrapper added ceremony without reducing the core complexity. This plan targets the actual duplication problem.

## Problem

`TimerDisplay.tsx` contains two functions — `getNextUpLabel()` (lines 28-70) and `getDisplayedExercise()` (lines 80-177) — that independently traverse the workout structure to determine "what comes next." This is the same traversal that `getNextPhase()` does in `src/lib/timer/store.ts`.

The duplication:

| Logic                                        | `getNextPhase()` in store | `getNextUpLabel()` in display | `getDisplayedExercise()` in display |
| -------------------------------------------- | ------------------------- | ----------------------------- | ----------------------------------- |
| "Is there a next exercise in this set?"      | Yes (line 57)             | Yes (line 48)                 | Yes (line 121)                      |
| "Should we repeat this set?"                 | Yes (line 78)             | Yes (line 50)                 | Yes (line 133)                      |
| "Is there a next set?"                       | Yes (line 98)             | Yes (line 54)                 | Yes (line 143)                      |
| "What's the first exercise of the next set?" | Yes (lines 117-126)       | No (just "Set N+1")           | Yes (lines 144-153)                 |

If a new phase is added (e.g., warm-up), or repeat logic changes, both the store and the display component need updating independently. They'll silently diverge.

## Solution

Extract a shared `getNextInfo()` function that computes both the next phase transition AND the display metadata (next exercise name, set/rep labels) in one pass. The store uses it for transitions; the display component uses it for labels.

---

## Target Architecture

```
src/lib/timer/
  transitions.ts   ← shared getNextInfo() function (new file, extracted from store + display)
  store.ts         ← imports getNextInfo for tick/skip
  types.ts         ← add NextInfo type
```

```
src/components/timer/
  TimerDisplay.tsx  ← imports getNextInfo, removes getNextUpLabel + getDisplayedExercise
```

---

## Step-by-Step Changes

### 1. Create `src/lib/timer/transitions.ts`

Extract the workout traversal logic into a single function that returns everything both the store and the display need:

```ts
import { TimerPhase, Workout, WorkoutSet, SetExercise } from './types'

export interface NextInfo {
  // For the store (phase transitions)
  phase: TimerPhase
  setIndex: number
  exerciseIndex: number
  repeat: number
  time: number

  // For the display (labels)
  nextExerciseName: string | null
  nextSetLabel: string // e.g. "Set 2 / 3"
  nextRepLabel: string // e.g. "Rep 1 / 4"
  nextExerciseLabel: string // e.g. "Exercise 1 / 5"
}

function getSetAtIndex(workout: Workout, setIndex: number): WorkoutSet | null {
  return setIndex < workout.sets.length ? workout.sets[setIndex] : null
}

function getExerciseAtIndex(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number
): SetExercise | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set || exerciseIndex >= set.exercises.length) return null
  return set.exercises[exerciseIndex]
}

function makeLabels(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number,
  repeat: number
): Pick<NextInfo, 'nextSetLabel' | 'nextRepLabel' | 'nextExerciseLabel'> {
  const set = workout.sets[setIndex]
  return {
    nextSetLabel: `Set ${setIndex + 1} / ${workout.sets.length}`,
    nextRepLabel: `Rep ${repeat} / ${set?.repeatCount ?? 1}`,
    nextExerciseLabel: `Exercise ${exerciseIndex + 1} / ${set?.exercises.length ?? 1}`,
  }
}

export function getNextPhaseInfo(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number,
  currentRepeat: number,
  currentPhase: TimerPhase
): NextInfo | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set) return null
  const exercise = getExerciseAtIndex(workout, setIndex, exerciseIndex)
  if (!exercise) return null

  // countdown → work
  if (currentPhase === 'countdown') {
    return {
      phase: 'work',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: exercise.workDuration,
      nextExerciseName: exercise.name,
      ...makeLabels(workout, setIndex, exerciseIndex, currentRepeat),
    }
  }

  if (currentPhase === 'work') {
    const isLastExercise = exerciseIndex >= set.exercises.length - 1

    // More exercises in this set
    if (!isLastExercise) {
      const nextEx = set.exercises[exerciseIndex + 1]
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: nextEx.name,
          ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
        }
      }
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: exerciseIndex + 1,
        repeat: currentRepeat,
        time: nextEx.workDuration,
        nextExerciseName: nextEx.name,
        ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
      }
    }

    // More repeats of this set
    if (currentRepeat < set.repeatCount) {
      const firstEx = set.exercises[0]
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: firstEx.name,
          ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
        }
      }
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstEx.workDuration,
        nextExerciseName: firstEx.name,
        ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
      }
    }

    // More sets in the workout
    if (setIndex < workout.sets.length - 1) {
      const nextSet = workout.sets[setIndex + 1]
      const nextEx = nextSet?.exercises[0]

      if (set.restBetweenSets > 0) {
        return {
          phase: 'restBetweenSets',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenSets,
          nextExerciseName: nextEx?.name ?? null,
          ...makeLabels(workout, setIndex + 1, 0, 1),
        }
      }
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: nextEx?.name ?? null,
          ...makeLabels(workout, setIndex + 1, 0, 1),
        }
      }
      if (!nextSet) return null
      return {
        phase: 'work',
        setIndex: setIndex + 1,
        exerciseIndex: 0,
        repeat: 1,
        time: nextEx!.workDuration,
        nextExerciseName: nextEx!.name,
        ...makeLabels(workout, setIndex + 1, 0, 1),
      }
    }

    // Workout complete
    return {
      phase: 'complete',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: 0,
      nextExerciseName: null,
      ...makeLabels(workout, setIndex, exerciseIndex, currentRepeat),
    }
  }

  if (currentPhase === 'rest') {
    const nextExercise = set.exercises[exerciseIndex + 1]
    if (nextExercise) {
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: exerciseIndex + 1,
        repeat: currentRepeat,
        time: nextExercise.workDuration,
        nextExerciseName: nextExercise.name,
        ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
      }
    }
    if (currentRepeat < set.repeatCount) {
      const firstEx = set.exercises[0]
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstEx.workDuration,
        nextExerciseName: firstEx.name,
        ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
      }
    }
    const nextSet = workout.sets[setIndex + 1]
    if (!nextSet) return null
    const nextEx = nextSet.exercises[0]
    return {
      phase: 'work',
      setIndex: setIndex + 1,
      exerciseIndex: 0,
      repeat: 1,
      time: nextEx.workDuration,
      nextExerciseName: nextEx.name,
      ...makeLabels(workout, setIndex + 1, 0, 1),
    }
  }

  if (currentPhase === 'restBetweenSets') {
    const nextSet = workout.sets[setIndex + 1]
    if (!nextSet) return null
    const nextEx = nextSet.exercises[0]
    return {
      phase: 'work',
      setIndex: setIndex + 1,
      exerciseIndex: 0,
      repeat: 1,
      time: nextEx.workDuration,
      nextExerciseName: nextEx.name,
      ...makeLabels(workout, setIndex + 1, 0, 1),
    }
  }

  return null
}
```

### 2. Update `src/lib/timer/store.ts`

Replace `getNextPhase` with `getNextPhaseInfo` from the shared module. The store only uses the phase transition fields:

```diff
-function getSetAtIndex(...) { ... }
-function getExerciseAtIndex(...) { ... }
-function getNextPhase(...) { ... }
+import { getNextPhaseInfo } from './transitions'

// In tick():
-const next = getNextPhase(workout, currentSetIndex, currentExerciseIndex, currentRepeat, phase)
+const next = getNextPhaseInfo(workout, currentSetIndex, currentExerciseIndex, currentRepeat, phase)
 if (next) {
   set({
     phase: next.phase,
     currentSetIndex: next.setIndex,
     currentExerciseIndex: next.exerciseIndex,
     currentRepeat: next.repeat,
     timeRemaining: next.time,
     // display fields are ignored by the store — only consumed by TimerDisplay
   })
 }
```

Same change in `skip()`.

### 3. Update `src/components/timer/TimerDisplay.tsx`

Remove `getNextUpLabel()` and `getDisplayedExercise()` (~150 lines). Replace with a call to `getNextPhaseInfo()`:

```tsx
import { getNextPhaseInfo, NextInfo } from '@/lib/timer/transitions'

export default function TimerDisplay({
  showWakeLockNotice,
}: TimerDisplayProps) {
  const {
    phase,
    timeRemaining,
    workout,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat,
    totalTimeElapsed,
  } = useTimerStore()

  const currentSet = workout?.sets[currentSetIndex]
  const currentExercise = currentSet?.exercises[currentExerciseIndex]
  const totalTime = workout ? getTotalWorkoutTime(workout) : 0
  const progressPercent = totalTime
    ? Math.min((totalTimeElapsed / totalTime) * 100, 100)
    : 0

  // Get next phase info from the shared transition function
  const nextInfo = workout
    ? getNextPhaseInfo(
        workout,
        currentSetIndex,
        currentExerciseIndex,
        currentRepeat,
        phase
      )
    : null

  // Derive display values from current state + next info
  const exerciseName =
    phase === 'rest' || phase === 'restBetweenSets'
      ? (nextInfo?.nextExerciseName ?? 'Exercise')
      : (currentExercise?.name ?? 'Exercise')

  const isUpcoming = phase === 'rest' || phase === 'restBetweenSets'

  const setLabel =
    isUpcoming && nextInfo
      ? nextInfo.nextSetLabel
      : `Set ${currentSetIndex + 1} / ${workout?.sets.length ?? 0}`

  const repLabel =
    isUpcoming && nextInfo
      ? nextInfo.nextRepLabel
      : `Rep ${currentRepeat} / ${currentSet?.repeatCount ?? 1}`

  const exerciseLabel =
    isUpcoming && nextInfo
      ? nextInfo.nextExerciseLabel
      : `Exercise ${currentExerciseIndex + 1} / ${currentSet?.exercises.length ?? 0}`

  const nextUpText = nextInfo?.nextExerciseName
    ? `Next: ${nextInfo.nextExerciseName}`
    : nextInfo?.phase === 'complete'
      ? 'Next: Finish'
      : 'Next: --'

  // ... render using exerciseName, setLabel, repLabel, exerciseLabel, nextUpText
}
```

This eliminates ~150 lines of duplicated workout traversal.

### 4. Update `src/lib/timer/types.ts`

Export the `NextInfo` type:

```ts
export type { NextInfo } from './transitions'
```

Or keep it only in `transitions.ts` — it's only needed by the store and TimerDisplay.

---

## Testing

The existing `store.test.ts` tests all transition paths. After this change, those tests still pass (the store's behavior is unchanged). Additionally, `transitions.ts` can be tested directly:

```ts
// src/lib/timer/transitions.test.ts
import { getNextPhaseInfo } from './transitions'

it('work → rest includes next exercise name', () => {
  const workout = createWorkout([
    {
      restBetweenExercises: 10,
      exercises: [
        { name: 'Push-ups', workDuration: 30 },
        { name: 'Squats', workDuration: 30 },
      ],
    },
  ])

  const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
  expect(next?.phase).toBe('rest')
  expect(next?.nextExerciseName).toBe('Squats')
  expect(next?.nextExerciseLabel).toBe('Exercise 2 / 2')
})
```

---

## Files Changed

| File                                    | Change                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/lib/timer/transitions.ts`          | New: shared `getNextPhaseInfo()` with display metadata                                |
| `src/lib/timer/store.ts`                | Remove `getNextPhase` + helpers, import from `transitions.ts`                         |
| `src/components/timer/TimerDisplay.tsx` | Remove `getNextUpLabel` + `getDisplayedExercise` (~150 lines), use `getNextPhaseInfo` |
| `src/lib/timer/transitions.test.ts`     | New: test transition + display output together                                        |
