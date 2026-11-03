# Plan 12: Close unit-test coverage gaps

## Problem

`npm run test:coverage` fails its thresholds (85% lines/functions/statements,
82% branches). Baseline on `main` after the 2026-11 dependency update:
76.31% statements, 68.72% branches, 71.01% functions, 77.37% lines.

The gap is concentrated in files added on 2026-03-08 without tests:

| File                                  | Lines covered |
| ------------------------------------- | ------------- |
| `src/components/home/WorkoutList.tsx` | 0%            |
| `src/lib/workout/validation.ts`       | 0%            |
| `src/lib/settings.ts`                 | 0%            |
| `src/lib/workout/queries.ts`          | 54%           |

## Approach

Test behavior, not lines. Each test should fail if a real regression happens.

- `validation.ts`: guards `POST /api/workouts` input. Cover the valid
  shape, each bound (min/max on names, durations, counts, rests, array
  sizes), type rejection (non-integer, wrong types), and the error-map shape
  (dotted paths like `sets.0.exercises.0.name`).
- `settings.ts`: defaults, valid round-trip, `null`/`undefined` input,
  missing fields filled from defaults, never throws on garbage.
- `queries.ts`: the untested hooks: `useWorkout`, `useUpdateWorkout`
  (detail cache write + list invalidation), `useCloneWorkout`, and the
  `useDeleteWorkout` rollback on error.
- `WorkoutList.tsx`: empty state, stats rendering, tag filtering, start
  (loads the timer store and navigates), delete (confirm/cancel), public
  toggle (fetch once, empty state, rendering), avatar fallback, sign out.

Added after the first pass left branches at 81.73% (vs 82%). Two more
components had no tests at all:

- `EditWorkoutForm.tsx`: pre-fill, submit payload (trim, tag split, clamp
  numbers, drop unnamed exercises and empty sets), blank-name guard, saving
  state, cancel. `WorkoutBuilderSets` is stubbed (it has its own suite).
- `PublicWorkoutView.tsx`: details and rest-period display, start, signed
  in vs signed out, clone success, in-flight and failure.

## Out of scope (known defects found while writing tests)

These are real issues, but fixing them changes behavior and belongs in its
own change. Tests here do not pin the buggy behavior.

1. `parseSettings` resets **all** fields to defaults if any one field is
   invalid, contradicting its docstring ("defaults for missing/invalid
   fields"). `PATCH /api/settings` therefore writes defaults (and returns 200) for an invalid body instead of rejecting it.
2. `WorkoutList` `handleDelete` doesn't catch API failures. A failed delete
   is an unhandled promise rejection with no user feedback.
3. `WorkoutList`: deleting the last workout with the selected tag leaves the
   filter on a tag that no longer exists, so the list shows blank with no
   empty state.
4. `WorkoutList`: a failed public-workouts fetch is swallowed and shown as
   "No public workouts yet", and is refetched on every toggle.
5. `EditWorkoutForm`: if the update request fails, `saving` is never reset.
   The button stays on "Saving...", the rejection is unhandled, and no
   error is shown.
6. `EditWorkoutForm`: submitting with no named exercises silently does
   nothing; there's no message explaining why.
7. `EditWorkoutForm`: the public toggle button has no accessible name or
   `aria-pressed`, so screen readers announce an unlabeled button.

## Outcome

| Metric     | Before | After  | Threshold |
| ---------- | ------ | ------ | --------- |
| Statements | 76.31% | 95.47% | 85%       |
| Branches   | 68.72% | 89.26% | 82%       |
| Functions  | 71.01% | 97.58% | 85%       |
| Lines      | 77.37% | 97.17% | 85%       |

Tests: 180 → 289. Spot-checked with deliberate regressions (removing the
delete rollback, loosening the duration cap, weakening the blank-exercise
filter); each made at least one new test fail.

## Verification

`npm run test:coverage` passes thresholds; `npm run check` green.
