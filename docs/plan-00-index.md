# Architectural Improvements: Implementation Index

Nine targeted improvements ordered by recommended implementation sequence. Each has a dedicated plan doc with exact diffs and file-level detail.

| #   | Plan                               | Effort  | Impact     | Status    | Doc                                       |
| --- | ---------------------------------- | ------- | ---------- | --------- | ----------------------------------------- |
| 1   | Tags as JSON array                 | Low     | Medium     | ✅ Merged | [plan-01](./plan-01-tags-json-array.md)   |
| 2   | Server components for data loading | Medium  | High       | ✅ Merged | [plan-03](./plan-03-server-components.md) |
| 3   | TanStack Query for server state    | Medium  | High       | ✅ Merged | [plan-04](./plan-04-tanstack-query.md)    |
| 4   | Wire up audio settings             | Low     | Medium     | ✅ Merged | [plan-07](./plan-07-audio-settings.md)    |
| 5   | Timer state persistence            | Low     | Medium     | ✅ Merged | [plan-02](./plan-02-timer-persist.md)     |
| 6   | Consolidate timer display logic    | Medium  | Medium     | ✅ Merged | [plan-05](./plan-05-timer-reducer.md)     |
| 7   | Settings Zod validation            | Low     | Low        | ✅ Merged | [plan-06](./plan-06-settings-zod.md)      |
| 8   | Timer drift correction             | Low     | Low-Medium | ✅ Merged | [plan-08](./plan-08-timer-drift.md)       |
| 9   | Fix service worker cache           | Trivial | Low        | ✅ Merged | [plan-09](./plan-09-sw-cache-fix.md)      |

## Dependencies between plans

```
Plan 01 (tags)           — fully independent
Plan 02 (timer persist)  — should come after Plan 05 (both touch timer store)
Plan 03 (server comp.)   — should come before Plan 04 (initialData pattern)
Plan 04 (TanStack Query) — depends on Plan 03 for best results; used by Plan 07 optionally
Plan 05 (display logic)  — independent; pairs well with Plan 02
Plan 06 (settings Zod)   — independent; pairs well with Plan 07
Plan 07 (audio settings) — independent, but benefits from Plan 04 or Plan 06
Plan 08 (timer drift)    — fully independent
Plan 09 (SW cache)       — fully independent
```

## Recommended implementation order

1. **Plan 01** — Tags. Isolated, no deps, cleans up data model.
2. **Plan 09** — SW cache fix. Trivial one-line fix, should just be done.
3. **Plan 03** — Server components. High impact. Include `w/[slug]` for SEO.
4. **Plan 04** — TanStack Query. Best after 03 so `initialData` flows naturally.
5. **Plan 07** — Audio settings. Low effort, fixes non-functional settings UI.
6. **Plan 06** — Settings Zod. Pairs with 07, types the settings shape.
7. **Plan 05** — Consolidate display logic. Removes ~150 lines of duplication.
8. **Plan 02** — Timer persist. Layer on the refactored store. **Must include hydration guard.**
9. **Plan 08** — Timer drift correction. Polish item.

## Changes from original plans

- **Plan 02 (timer persist):** Added critical hydration guard — without it, persist causes the timer page to redirect on every refresh, making the feature useless.
- **Plan 05 (timer reducer):** Replaced with "consolidate display logic." The original reducer wrapper added ceremony without reducing complexity. The real duplication is between `getNextPhase()` in the store and `getNextUpLabel()`/`getDisplayedExercise()` in `TimerDisplay.tsx`.
- **Plan 06 (settings Zod):** Fixed schema to match actual settings fields (4 audio booleans + theme + accessibility), not the incorrect `soundEnabled`/`countdownSeconds` from the original.
- **Plan 03 (server components):** Added `src/app/w/[slug]/page.tsx` conversion for SEO on public workout URLs, with `generateMetadata`.
- **Plans 07-09:** New plans for audio settings disconnect, timer drift, and SW cache.
