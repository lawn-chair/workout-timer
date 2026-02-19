# Plan: Separate Test Databases

## Goal

Use separate SQLite databases for unit tests and e2e tests, while keeping development on its own DB. Make this the default behavior via env files, db selection logic, and scripts.

## Scope

- Add test-specific env files for Vitest and Playwright.
- Route DB selection in the Prisma client setup based on test flags.
- Update npm scripts to load the right env files automatically.
- Ignore new test DB files in git.
- Document workflow defaults in AGENTS.md.

## Steps

1. Add `.env.test` with `DATABASE_URL="file:./test.db"`.
2. Add `.env.e2e` with `DATABASE_URL="file:./e2e.db"`.
3. Update `src/lib/db.ts` to choose DB in order:
   - `process.env.DATABASE_URL` (explicit override)
   - `NODE_ENV === 'test'` or `VITEST` -> `file:./test.db`
   - `E2E_TESTING === 'true'` -> `file:./e2e.db`
   - fallback -> `file:./dev.db`
4. Update `package.json` scripts to load `.env.test` for `test:run` and `.env.e2e` for `test:e2e`.
5. Add `test.db` and `e2e.db` to `.gitignore`.
6. Update `AGENTS.md` with new workflow defaults.
7. Run `npm run check`.

## Validation

- `npm run check` passes.
- Vitest and Playwright each write to their own SQLite files.
