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
- `@types/node` latest (26) — types should track the runtime Node major, not
  "latest". Moved to `^22` only (forced by the vitest 5 peer range).

## Verification

`npm run check` (lint, typecheck, prisma validate, unit, e2e, coverage, audit),
plus `next build` smoke test.

## Outcome

| Package                      | From → To               | Result                                                                                    |
| ---------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- |
| next / eslint-config-next    | 16.3.0 → 16.4.3         | ✅                                                                                        |
| react / react-dom            | 19.2.8 → 19.3.1         | ✅                                                                                        |
| vitest / @vitest/coverage-v8 | 4 → 5                   | ✅                                                                                        |
| @vitejs/plugin-react         | 5 → 6                   | ✅                                                                                        |
| jsdom                        | 28 → 30                 | ✅                                                                                        |
| @testing-library/jest-dom    | 6 → 7                   | ✅ setup imports `@testing-library/jest-dom/vitest`                                       |
| @types/node                  | ^20 → ^22               | ✅ required by vitest 5 peer                                                              |
| dotenv                       | 17 → 18                 | ✅ `-r dotenv/config` + `DOTENV_CONFIG_PATH` still honored                                |
| lint-staged                  | 16 → 17                 | ✅                                                                                        |
| @vercel/analytics            | 1 → 2                   | ✅ insights script verified injected in prod build                                        |
| Transitive (`npm audit fix`) | fast-uri, source-map-js | ✅ high advisories resolved                                                               |
| @libsql/client               | 0.17 → 0.18             | ⏸ held: `@prisma/adapter-libsql` pins `^0.17`                                             |
| eslint                       | 9 → 10                  | ⏸ held: eslint-plugin-react/import/jsx-a11y (via eslint-config-next) peer-cap at ESLint 9 |
| prisma                       | 7 → 8                   | ⏸ held: RC only                                                                           |
| typescript                   | 5 → 7                   | ⏸ held: native compiler; needs Next.js toolchain support                                  |

### Notes

- Node ≥22 is now the effective dev floor (jsdom 30, jest-dom 7, lint-staged 17).
- Coverage thresholds fail identically on `main` (77.37% lines vs 85%); not
  caused by this change.
- npm 10.9's arborist crashes (`edgesOut` of null) resolving vitest's optional
  peer set; installs were done with npm 11.
