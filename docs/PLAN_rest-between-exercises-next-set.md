# Plan: Rest Between Exercises Before Next Set

## Goal

When the last exercise in a set completes and another set follows, apply the
rest-between-exercises duration if rest-between-sets is zero.

## Scope

- Update timer phase transitions in `src/lib/timer/store.ts`.
- Add tests in `src/lib/timer/store.test.ts` for the new behavior.

## Approach

1. Update the `work` phase transition for the last exercise of the last repeat
   to use rest-between-exercises when rest-between-sets is zero.
2. Extend the `rest` phase transition to advance to the next set if no more
   exercises or repeats remain in the current set.
3. Add a test that covers the new rest behavior and confirms the move to the
   next set.

## Tests

- `npm run test:run -- src/lib/timer/store.test.ts`
- `npm run check`
