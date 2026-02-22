# Plan: Coverage Threshold Fix

## Goal

Raise global branch coverage to meet the 82% threshold without changing
production behavior.

## Scope

- Identify files/branches pulling global branch coverage below 82%.
- Add focused tests to cover missing branches.
- Re-run coverage to confirm the threshold is met.

## Approach

1. Run `npm run test:coverage` to generate coverage artifacts.
2. Inspect coverage summary to find lowest branch coverage areas.
3. Add targeted tests for uncovered branches.
4. Re-run `npm run test:coverage` to verify the threshold.

## Tests

- `npm run test:coverage`
