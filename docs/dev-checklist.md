# Dev Checklist

## Before you start

- Read `AGENTS.md`.
- `git fetch origin` and create a new branch from `origin/main`.
- Confirm branch and tracking with `git status -sb` and `git branch -vv`.
- Write a plan to a descriptive `docs/*.md` file.

## While you work

- Follow existing conventions and patterns.
- Add tests for any new feature or bug fix.
- Keep changes scoped to the task.

## Before you open a PR

- Run `npm run check` and ensure it passes.
- Ensure the branch is up to date with `origin/main` if needed.
- Verify commits match the task scope.
