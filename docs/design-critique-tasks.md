# Workout Timer — Fix Tasks for Claude Code

Each task below is self-contained — copy one block at a time into Claude Code.
They're ordered Critical → Moderate → Minor/Polish. Repo: `lawn-chair/workout-timer`.

---

## Task 1 [Critical] — High Contrast theme doesn't affect the timer screen

In `src/app/globals.css`, the `[data-theme='high-contrast']` block redefines the phase color variables (`--work`, `--rest`, `--countdown`, `--rest-sets`, `--complete`), but the `.phase-work`, `.phase-rest`, `.phase-countdown`, `.phase-rest-sets`, and `.phase-complete` classes — which are what's actually applied to the full-screen background during a workout (see `src/components/timer/TimerDisplay.tsx`, `phaseColors` map) — use hardcoded hex gradients instead of referencing those variables. So switching to High Contrast mode changes buttons/surfaces everywhere but leaves the workout screen itself completely unchanged.

Fix: update each `.phase-*` rule in `globals.css` to build its gradient from the corresponding CSS variable instead of literal hex values, e.g.:

```css
.phase-work {
  background: linear-gradient(
    160deg,
    var(--work),
    color-mix(in srgb, var(--work) 70%, black)
  );
}
```

Apply the same pattern to `.phase-rest` (`--rest`), `.phase-countdown` (`--countdown`), `.phase-rest-sets` (`--rest-sets`), and `.phase-complete` (`--complete`). Verify by toggling `data-theme="high-contrast"` on `<html>` and confirming the timer's countdown/work/rest screens actually change to the high-contrast palette (pure green/red/yellow/cyan on black).

---

## Task 2 [Critical] — Large Text mode doesn't enlarge any actual text

In `src/app/globals.css`, `[data-theme='large-text']` sets `--font-size-base: 18px`, and the only consumer is `body { font-size: var(--font-size-base, 16px) }`. But every sized element in the app uses Tailwind's rem-based utility classes (`text-xs`, `text-4xl`, `text-[7rem]`, etc.), which resolve against the root `<html>` element's font-size, not `<body>`'s — and there is no `html { font-size }` rule anywhere. So toggling "Large Text" has no visible effect on any interface text, including the giant timer numeral it should matter most for.

Fix: move the scaling to the root element so rem units actually respond, e.g. in `globals.css`:

```css
html {
  font-size: var(--font-size-base, 16px);
}
```

and remove or keep the `body` rule as redundant. Then re-check whether 18px root (a ~12.5% bump) is enough of a jump for the preset's stated purpose — consider whether the giant timer digits (`text-[7rem] md:text-[10rem]` in `TimerDisplay.tsx`) need their own larger step, since they're the most important text to enlarge and a flat root percentage increase may not be enough for that element specifically. Verify by toggling the preset and confirming the timer digits and body copy visibly grow.

---

## Task 3 [Critical] — "Stop" discards an in-progress workout with no confirmation

In `src/lib/timer/store.ts`, `stop()` immediately sets `workout: null` (and resets all timer state) with no confirmation step. `src/app/timer/page.tsx` then redirects to `/` as soon as `workout` becomes null via its `useEffect`. In `src/components/timer/TimerControls.tsx`, the Stop button is a 64px circle positioned directly next to the main pause/resume button (16px gap) — an easy accidental tap mid-workout that permanently loses all progress.

For comparison, `src/components/home/WorkoutList.tsx`'s delete-workout button already guards itself with `confirm('Delete this workout?')` — apply the same pattern here.

Fix: in `TimerControls.tsx`, wrap the `stop` call in a confirmation before invoking it, e.g.:

```tsx
const handleStop = () => {
  if (!confirm('Stop this workout? Your progress will be lost.')) return
  stop()
}
```

and wire the Stop button's `onClick` to `handleStop` instead of `stop` directly. (A native `confirm()` matches the existing pattern in the codebase; a custom modal would also work if you want to match the app's visual language more closely — your call.)

---

## Task 4 [Critical] — Countdown phase text contrast is far below WCAG minimums

In `src/app/globals.css`, `.phase-countdown` is `linear-gradient(160deg, #f6c945, #c28b1e)` (light gold to darker gold). In `src/components/timer/TimerDisplay.tsx`, the phase label and other text on top of it are white at 70–80% opacity (`text-white/80`, `text-white/70`). Computed against the lighter gold stop alone, full-opacity white text is only ~1.6:1 contrast — far under WCAG's 4.5:1 (normal text) or 3:1 (large text) minimums. This is the very first screen shown before every workout.

Fix — pick one or combine:

1. Darken `.phase-countdown`'s gradient stops so white text clears at least 4.5:1 against the lightest point (e.g. shift toward `#b8860b`/`#8f6a15`-range golds).
2. Add a subtle text-shadow or scrim behind the text block (a `background: rgba(0,0,0,0.25)` panel behind the label/timer, or a `text-shadow: 0 2px 8px rgba(0,0,0,0.5)`).
3. Remove the opacity reduction on label text (`text-white/80` → `text-white`) — this alone won't fully solve it but removes one compounding factor.

Verify with a contrast checker against the actual rendered gradient at its lightest point.

---

## Task 5 [Moderate] — Theme/accessibility changes require Save + a network round-trip before they apply

In `src/app/settings/page.tsx`, clicking a Theme or Accessibility option only calls local `setSettings(...)` — the calls that actually flip `data-theme` on the document (`setTheme` / `setAccessibility` from `useTheme()`) only fire inside `handleSave`, after `updateUserSettings()` resolves. Someone switching to High Contrast or Large Text because they're struggling to read the screen right now has to complete an API call first, with no live preview.

Fix: call `setTheme(value)` / `setAccessibility(value)` immediately when the buttons are clicked (applying the visual change live), and keep the existing `handleSave` flow purely for persisting the choice to the backend. E.g.:

```tsx
onClick={() => {
  setSettings((prev) => ({ ...prev, theme: value as ThemeMode }))
  setTheme(value as ThemeMode) // apply immediately, persist on Save
}}
```

Do the same for the accessibility preset buttons. Confirm the theme/preset visibly changes the instant you click, before pressing "Save Settings."

---

## Task 6 [Moderate] — Workout builder never shows the total time it already knows how to compute

`getTotalWorkoutTime()` in `src/lib/timer/types.ts` is used to show "Est. Time" on the home list (`src/components/home/WorkoutList.tsx`), but it's never called while actually building a workout in `src/app/workouts/new/page.tsx` or `src/components/workout/EditWorkoutForm.tsx`. Someone assembling several sets and exercises only discovers the total duration after saving and returning to the list.

Fix: in both `workouts/new/page.tsx` and `EditWorkoutForm.tsx`, compute a live total from the current `sets` draft state and render it near the top of the form (e.g. next to the "Sets" heading or as a sticky summary bar). Note `getTotalWorkoutTime` takes a `Workout`-shaped object with `sets`, so you'll need a small adapter to call it against the in-progress `SetDraft[]` state (from `src/lib/workout/builder.ts`) rather than a saved `Workout` — either adjust the function to accept the draft shape, or map the draft into the minimal shape it needs before calling it.

---

## Task 7 [Moderate] — No distinct field for "rest before repeating a set"

In `src/lib/timer/transitions.ts`, when `currentPhase === 'work'` and `currentRepeat < set.repeatCount`, the rest before the next repeat reuses `set.restBetweenExercises`:

```ts
if (currentRepeat < set.repeatCount) {
  const firstEx = set.exercises[0]
  if (set.restBetweenExercises > 0) {
    return { phase: 'rest', time: set.restBetweenExercises, ... }
  }
  ...
}
```

But `src/components/workout/WorkoutBuilderSets.tsx` presents "Repeat Count," "Rest Between Exercises," and "Rest Between Sets" as three independent, complete fields — nothing indicates that resting before a repeat is tied to the "between exercises" value rather than having its own control. A circuit with 0s between exercises but a deliberate breather before repeating the round can't be expressed.

Fix: either (a) add a new field, e.g. `restBetweenRepeats`, to `SetDraft`/`WorkoutSet` (types in `src/lib/workout/types.ts` and `src/lib/timer/types.ts`), thread it through `builder.ts`, the builder UI, and `transitions.ts` in place of the reused `restBetweenExercises`; or (b), if you want to keep the model simple, at minimum add a caption under "Rest Between Exercises" in the builder UI clarifying "also applies before repeating this set." Prefer (a) if you're willing to touch the DB schema/migration; it's the correct fix.

---

## Task 8 [Moderate] — Timer display font is a poor match for glanceable numerals

In `src/app/layout.tsx`, `--font-display` is Bebas Neue — a narrow, condensed, all-caps display face — and it's used for the countdown numerals themselves in `src/components/timer/TimerDisplay.tsx` (`text-[7rem] md:text-[10rem]`), not just for headline moments like "Workout Complete!". Condensed display faces are optimized for short punchy headlines, not for numerals someone needs to read at a glance, out of breath, from a few feet away.

Fix: keep Bebas Neue for headline text ("Workout Complete!", "Get Ready," etc.) but give the actual countdown numeral its own font — a geometric or tabular-figure-friendly face (e.g. a monospaced/tabular numeral variant, or the existing Manrope body font at a heavy weight with `font-variant-numeric: tabular-nums` — note `tabular-nums` is already applied via the `tabular-nums` class, just to the wrong typeface). Add a new font variable if needed in `layout.tsx`, or simply switch the timer digit's className off `display-font` onto a numeral-appropriate stack.

---

## Task 9 [Minor] — No way to extend rest or undo an accidental Skip

`src/components/timer/TimerControls.tsx` only exposes Stop / Pause·Resume / Skip. There's no "+15s" during rest for someone who needs more recovery, and no way to reverse a Skip that fired by accident.

Fix: add a small "+15s" control visible only during `rest`/`restBetweenSets` phases that adds to `timeRemaining` in the store (a new `addTime(seconds)` action alongside `pause`/`resume`/`skip` in `src/lib/timer/store.ts`). An "undo last skip" is more involved (would need a small history stack of prior phase states) — treat as a stretch goal if the simple rest-extension ships first.

---

## Task 10 [Minor] — Audit raw Tailwind color classes against the CSS variable token system

The app defines a proper token system in `globals.css` (`--lime`, `--cyan`, `--work`, etc.) but many components fall back to raw Tailwind palette classes instead — e.g. `text-gray-400`, `text-red-300`, `border-red-500/40`, `bg-lime-400 text-black` (in the Settings theme buttons), and `text-cyan-300` (used exactly once, for the homepage "Focus" eyebrow label). These won't track if the token values ever change, and cyan in particular reads as a stray one-off accent rather than a system color.

Fix: grep for `text-gray-`, `text-red-`, `bg-red-`, `text-cyan-`, `bg-lime-`, `text-lime-` across `src/components` and `src/app`, and for each decide: (a) map it onto an existing CSS variable/utility if it's meant to be systematic (e.g. muted text → `var(--muted)` / `var(--muted-2)`), or (b) leave it as an intentional one-off if it truly is (e.g. destructive-red on the delete button is probably fine as-is). Either retire the unused `--cyan` variable or give it a real, repeated job (e.g. always denotes "live/in-progress" state).

---

## Task 11 [Minor] — Pause/Resume button has no accessible name

In `src/components/timer/TimerControls.tsx`, the pause/resume button's only content is a literal `⏸` / `▶` character glyph, with no `aria-label`. Screen readers announce these inconsistently across platforms. The drag handles in `src/components/workout/WorkoutBuilderSets.tsx` already do this correctly (`aria-label="Reorder set"` / `aria-label="Reorder exercise"`) — apply the same pattern here.

Fix:

```tsx
<button
  onClick={isRunning ? pause : handleResume}
  aria-label={isRunning ? 'Pause workout' : 'Resume workout'}
  className="w-20 h-20 rounded-full bg-white text-gray-900 text-2xl font-bold"
  data-testid="timer-pause-button"
>
  {isRunning ? '⏸' : '▶'}
</button>
```

Also double check the Stop (`data-testid="timer-stop-button"`) and Skip (`data-testid="timer-skip-button"`) buttons — they have visible text labels already, so no change needed there, but confirm during this pass.

---

## Task 12 [Minor] — "Countdown Beeps" setting description doesn't match actual behavior

In `src/app/settings/page.tsx`, the "Countdown Beeps" toggle is described as _"3-2-1 beeps before exercise starts."_ But `src/lib/timer/useTimerAudio.ts` fires the same beep whenever `timeRemaining <= 3` in any running phase — so it also beeps in the final 3 seconds of every rest period, not just before the very first exercise.

Fix: update the description in `settings/page.tsx` to something like _"3-2-1 beeps before every work or rest phase ends"_ to match what it actually does (which is arguably the better, more useful behavior — just mislabeled).

---

## Task 13 [Minor] — Homepage aside panels are decorative, not functional

In `src/components/home/WorkoutList.tsx`, the right-hand column's "Train with intent" and "Next session" panels show static copy with no real data (no actual next workout, no stat, no streak) and duplicate the "Create Workout" CTA that already appears in the header and in the empty state — three copies of the same action on one screen.

Fix: either surface real data (last completed workout, a suggested workout, a simple streak count) or remove the panels and let the main list take the full width. Flagging for your call rather than prescribing a specific replacement — happy to spec this further if you want to keep the aside.

---

## Task 14 [Minor] — "Browse Public" swap has almost no visual context change

In `src/components/home/WorkoutList.tsx`, toggling "Browse Public" replaces the whole list with community workouts using the identical card layout and page chrome — the only signals of the context switch are the button label flipping to "My Workouts" and the section heading text. A user's own public workouts already carry a "Public" chip in the normal view, so the two contexts can look similar enough to lose track of which one you're in after a distraction.

Fix: add a persistent visual cue for the public-browsing context — e.g. a distinct top-of-section banner color/icon, or a breadcrumb-style label ("Viewing: Community Library") that stays visible the whole time `showPublic` is true in `WorkoutList.tsx`.
