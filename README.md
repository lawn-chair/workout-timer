## Workout Timer

Workout Timer is a Next.js app for building interval workouts and running them with a guided timer. Create workouts with sets and exercises, start a live timer flow, and share public workouts that others can view and clone.

## Features

- Build workouts with sets, exercises, and rest rules
- Run workouts with a dedicated timer UI and completion flow
- Tag workouts and toggle public visibility
- Browse public workouts and clone them into your account
- Configure audio cues in settings

## Tech Stack

- Next.js App Router
- NextAuth (Google OAuth + dev credentials provider)
- Prisma + SQLite (libSQL adapter)
- Zustand for client state
- Vitest + Playwright for tests

## Getting Started

### Requirements

- Node.js 20+
- npm 9+

### Install

```bash
npm install
```

### Environment Variables

Create a `.env` file based on the existing template values. These are the expected variables:

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-change-in-production"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Enable dev credentials provider (optional)
DEV_AUTH="true"

# Enable in CI/e2e contexts
E2E_TESTING="true"
```

Notes:

- The app uses SQLite files by environment. If `DATABASE_URL` is not set, it falls back to `dev.db`, `test.db`, or `e2e.db` depending on the env.
- In development, the login screen allows a dev user when `DEV_AUTH=true`.

### Run the App

```bash
npm run dev
```

Open `http://localhost:3000`.

## Developer Scripts

```bash
npm run dev            # Start dev server
npm run check          # Lint + typecheck + unit + e2e tests
npm run test:run       # Unit tests once (Vitest)
npm run test:e2e       # Playwright e2e tests
npm run lint           # ESLint
npm run typecheck      # TypeScript typecheck
```

## App Overview

### Key Routes

- `/` - Authenticated workout list and public browse toggle
- `/workouts/new` - Create a workout
- `/workouts/[id]/edit` - Edit a workout
- `/timer` - Active workout timer
- `/settings` - Audio preferences
- `/w/[slug]` - Public workout detail and clone
- `/login` - Auth entry point

### API Routes

- `GET /api/workouts` - List current user workouts
- `POST /api/workouts` - Create workout
- `GET /api/workouts/[id]` - Get workout (public or owner)
- `PATCH /api/workouts/[id]` - Update workout
- `DELETE /api/workouts/[id]` - Delete workout
- `POST /api/workouts/[id]/clone` - Clone public workout
- `GET /api/workouts/public` - List public workouts
- `GET /api/workouts/public/[id]` - Get public workout by id or slug
- `GET /api/settings` - Read user settings
- `PATCH /api/settings` - Update user settings

## Project Structure

- `src/app/` - App Router pages and API routes
- `src/components/` - UI components
- `src/lib/` - Stores, auth, and data helpers
- `prisma/` - Prisma schema and migrations

## Architecture

- Next.js App Router serves both UI and API routes
- NextAuth manages sessions; Google OAuth in production, credentials in dev
- Prisma persists users, workouts, and settings in SQLite
- Client state and timer logic live in Zustand stores and hooks
- Public workouts are read-only; cloning creates private copies

## Testing

- Unit and component tests: co-located under `src/` with `*.test.ts(x)`
- E2E tests: `e2e/` (Playwright)

Run all checks with:

```bash
npm run check
```
