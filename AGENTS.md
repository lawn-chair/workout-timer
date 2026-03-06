# Agent Development Guide

## Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Run tests with UI
npm run test:coverage # Generate coverage report

# Linting & Formatting
npm run lint         # Check linting
npm run lint:fix     # Fix linting issues
npm run format       # Format code (Prettier)
npm run format:check # Check formatting

# Type Checking
npm run typecheck    # TypeScript type check

# Full Check (runs before commits)
npm run check        # lint + typecheck + tests
```

## Workflow

- Review `docs/dev-checklist.md` before starting any new work.
- Create a new branch from `origin/main` for each task.
- Never reuse an existing branch for a new feature or fix.
- Write a plan to a descriptive `/docs/*.md` file before implementation.
- Auto-commit after each task, including both feature and tests when practical.
- Run `npm run check` before opening a PR.

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility functions
- `src/test/` - Test setup and utilities

## Testing

- Framework: Vitest + React Testing Library
- Test files: `*.{test,spec}.{ts,tsx}` in `src/`, co-located with the code they test
- Setup: `src/test/setup.ts` (includes jest-dom matchers)

Always write tests for new features and bug fixes.

## Conventions

- Use TypeScript for all files
- Use functional components with hooks
- Use `@/` alias for imports (maps to `src/`)
- Write tests for all new features and bug fixes

## Subagents

This project has specialized subagents for domain-specific tasks:

- `@timer-expert` - Timer functionality (`src/lib/timer/**`, `src/components/timer/**`)
- `@workout-expert` - Workout management (`src/lib/workout/**`, `src/app/api/workouts/**`)
- `@ui-expert` - UI components (`src/components/**`)
- `@test-expert` - Testing (all `*.test.{ts,tsx}`)
- `@docs-expert` - Documentation (`docs/**`, `README.md`)

Example: `@timer-expert "add countdown beep before rest ends"`
