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

## Workflow Defaults

- Always write a plan to a descriptive `/docs/*.md` file before implementation.
- Review `docs/dev-checklist.md` before starting any new work.
- Always create a new branch for work.
- Auto-commit after each task, including both feature and tests when practical.
- Run `npm run check` before opening a PR, and only open the PR after tests pass.

## Project Structure

- `src/app/` - Next.js App Router pages
- `src/components/` - React components
- `src/lib/` - Utility functions
- `src/test/` - Test setup and utilities

## Testing

**Always write tests for new features and bug fixes.** This is required for every change.

- Framework: Vitest + React Testing Library
- Test files: `*.{test,spec}.{ts,tsx}` in `src/`, co-located with the code they test
- Setup: `src/test/setup.ts` (includes jest-dom matchers)

### When to write tests

- Add new feature → write tests
- Fix a bug → write a test that reproduces the bug first, then fix it
- Refactor code → ensure existing tests still pass

### What to test

- Business logic (store/state management): always write unit tests
- Utility functions: write unit tests
- React components: write component tests for user interactions and rendering

Example test:

```tsx
import { render, screen } from '@testing-library/react'
import MyComponent from './MyComponent'

test('renders', () => {
  render(<MyComponent />)
  expect(screen.getByText('Hello')).toBeInTheDocument()
})
```

## Conventions

- Use TypeScript for all files
- Use functional components with hooks
- Use `@/` alias for imports (maps to `src/`)
- Run `npm run check` before completing any task
- Write tests for all new features and bug fixes
