# Plan: Add rest between set repeats

## Goal

Ensure a rest period occurs between each repeat of a set using the existing
`restBetweenExercises` value, in addition to the current rests between exercises
and between sets.

## Scope

- Timer transitions in `src/lib/timer/store.ts` for repeat boundaries.
- Total workout time calculation in `src/lib/timer/types.ts`.
- Tests in `src/lib/timer/store.test.ts`.

## Approach

1. Update the repeat boundary logic in the `work` phase to insert a `rest` phase
   when `currentRepeat < repeatCount` and `restBetweenExercises > 0`.
2. After the new `rest` phase completes, start the next repeat at exercise 0.
3. Add rest-between-repeats to total time calculation:
   `Math.max(repeatCount - 1, 0) * restBetweenExercises`.
4. Add tests to cover:
   - entering `rest` between repeats,
   - returning to exercise 0 after that rest,
   - skipping the rest when `restBetweenExercises` is 0.

## Risks/Notes

- Must not affect the existing rest-between-exercises and rest-between-sets
  behavior.
- Ensure `repeatCount` is treated as at least 1.
