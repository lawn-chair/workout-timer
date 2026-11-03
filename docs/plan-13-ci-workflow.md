# Plan 13: Run `npm run check` in CI

## Problem

Nothing runs the quality gate automatically. `npm run check` (lint,
typecheck, prisma validate, unit, e2e, coverage, audit) only runs when someone
remembers to type it, and the pre-commit hook runs only lint-staged and e2e.
That's how coverage drifted from passing to 77% between 2026-03 and 2026-11
without anyone noticing.

## Approach

Add `.github/workflows/ci.yml` running `npm run check` on every pull request
and on pushes to `main`.

- **Single job running `npm run check`**, not split into per-tool jobs. The
  script is the source of truth for what "passing" means. Mirroring its steps
  in YAML would let the two drift apart.
- **Node 22.** This is the dev floor (jsdom 30, jest-dom 7, lint-staged 17 need ≥22).
- **`npx prisma generate`** before the check. `src/generated/prisma` is
  gitignored and typecheck/tests import it. (`npm run build` does this
  itself, but `check` does not.)
- **Chromium only** (`playwright install --with-deps chromium`). It's the
  only project in `playwright.config.ts`.
- **No secrets needed.** `.env.test` and `.env.e2e` are committed and point
  at local SQLite files.
- **Security:** triggered by `pull_request` (not `pull_request_target`), so
  fork PRs run without secrets. `permissions: contents: read`, and checkout
  with `persist-credentials: false`.
- **`concurrency`** cancels superseded runs on the same ref.
- **Playwright HTML report** uploaded as an artifact on failure.

## Known tradeoffs

- `check` runs the unit suite twice (`test:run`, then `test:coverage`).
  That's ~10s of waste; not worth diverging from the script.
- The `audit` step can turn CI red when a new advisory is published, with
  no code change. That's intended for a gate, but it means a red run isn't
  always caused by the PR.
- The coverage gate fails on `main` until the coverage-gaps PR (#54) merges,
  so this PR's own run will be red until then.

## Follow-up (not in this change)

Make the check required in branch protection for `main` (repo settings →
Branches). That's a repo-admin setting, not a file.
