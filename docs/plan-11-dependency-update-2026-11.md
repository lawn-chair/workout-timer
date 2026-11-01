# Plan 11: Dependency update (2026-11)

## Goal

Bring dependencies current without destabilizing the app. Land safe updates;
evaluate majors individually and only keep those that pass `npm run check`.

## Tier 1 — in-range and minor bumps (low risk)

- `npm update` for everything within existing semver ranges
  (`@playwright/test`, `@prisma/adapter-libsql`, `prisma` 7.x, `@tanstack/react-query`,
  testing-library, `@types/react*`, `vitest`/`@vitest/coverage-v8` 4.x, `prettier`, `zod`, `zustand`).
- Pinned bumps: `next` + `eslint-config-next` 16.3.0 → 16.4.x (kept in lockstep),
  `react` + `react-dom` 19.2.8 → 19.3.x.
- `@libsql/client` 0.17 → 0.18 (0.x minor is technically breaking; verify against
  `@prisma/adapter-libsql` peer range).

## Tier 2 — majors, evaluated one at a time

Each is tried in isolation; kept only if lint, typecheck, unit + e2e tests pass
and the changelog shows nothing affecting this codebase.

- `vitest` / `@vitest/coverage-v8` 4 → 5, `@vitejs/plugin-react` 5 → 6
- `jsdom` 28 → 30, `@testing-library/jest-dom` 6 → 7
- `eslint` 9 → 10 (gated on `eslint-config-next` support)
- `dotenv` 17 → 18, `lint-staged` 16 → 17
- `@vercel/analytics` 1 → 2

## Explicitly skipped

- `prisma` 8 — only release candidates are published.
- `typescript` 7 — native (Go) compiler rewrite; needs Next.js toolchain support
  to be confirmed separately.
- `@types/node` — tracks the deployment Node runtime, not "latest". Bump only
  alongside a deliberate runtime upgrade.

## Verification

`npm run check` (lint, typecheck, prisma validate, unit, e2e, coverage, audit),
plus `next build` smoke test.
