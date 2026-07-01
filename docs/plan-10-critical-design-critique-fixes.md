# Plan 10 — Critical fixes from design critique

Source: `docs/design-critique-tasks.md`, Tasks 1-4 (Critical severity). Full critique
of 14 tasks was pulled from the "Workout timer critique" Claude Design project;
this PR addresses only the four Critical items. Moderate/Minor items remain in
the tasks doc for future PRs.

## Task 1 — High Contrast theme doesn't affect the timer screen

`globals.css` `.phase-work/.phase-rest/.phase-countdown/.phase-rest-sets/.phase-complete`
use hardcoded hex gradients instead of the `--work/--rest/--countdown/--rest-sets/--complete`
variables that `[data-theme='high-contrast']` redefines. Rewrite each `.phase-*` rule to
build its gradient from `var(--work)` etc. via `color-mix` for the darker stop.

## Task 2 — Large Text mode doesn't enlarge any actual text

`--font-size-base` is only consumed by `body { font-size: ... }`, but Tailwind's rem
utilities resolve against `<html>`'s font-size, which is never set. Add
`html { font-size: var(--font-size-base, 16px); }`. Keep the `body` rule (harmless,
now redundant). 18px root (12.5% bump) is a legitimately small step for the preset's
stated purpose, but changing the root-level jump beyond what the critique specifies
is out of scope here — flagging that the giant timer digits may still want their own
larger step is Task 2's suggestion, not a requirement; skipping any digit-specific
sizing change to keep this fix minimal and testable.

## Task 3 — "Stop" discards an in-progress workout with no confirmation

`TimerControls.tsx`'s Stop button calls `stop()` directly. Add a `handleStop` wrapper
using `window.confirm(...)`, matching the existing pattern in
`WorkoutList.tsx`'s delete button. Wire Stop's `onClick` to the wrapper.

## Task 4 — Countdown phase text contrast is far below WCAG minimums

`.phase-countdown` gradient (`#f6c945` → `#c28b1e`) is too light for white text at
reduced opacity to clear WCAG AA (4.5:1). Fix combines critique options 1 and 3:
darken the gradient stops (`#b8860b` → `#8f6a15` range) and remove the opacity
reduction on the phase label (`text-white/80` → `text-white`) so contrast clears
4.5:1 against the lightest point of the new gradient.

## Testing

- `TimerControls.test.tsx` (new or extended): Stop button triggers `confirm()`
  before calling `store.stop()`; cancelling `confirm()` leaves the store untouched.
- Existing timer/store tests should continue passing unchanged.
- Manual verification: toggle `data-theme="high-contrast"` and `data-theme="large-text"`
  in devtools and confirm visual changes on the timer screen; check contrast of
  `.phase-countdown` with a contrast checker.

## Out of scope

Tasks 5-14 (Moderate/Minor) — tracked in `docs/design-critique-tasks.md` for later PRs.
