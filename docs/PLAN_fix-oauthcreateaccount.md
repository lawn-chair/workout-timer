# Plan: Fix OAuthCreateAccount (image field mismatch)

## Goal

Allow Google sign-in to create users without adapter errors by aligning the Prisma User model with NextAuth user fields.

## Findings

- NextAuth Prisma adapter attempts to create `User` with `image` and `emailVerified`.
- Prisma `User` model currently lacks `image` and `emailVerified`, causing `Unknown argument 'image'` on create.

## Approach

1. Update Prisma schema to include `image` and `emailVerified` on `User`.
2. Add a migration for these fields.
3. Add a unit test to ensure `authOptions` wiring remains intact (no behavior change, only schema alignment).
4. Regenerate Prisma client if needed (build already does this).

## Validation

- Run `npm run test:run`.
- (Optional) deploy and verify Google sign-in succeeds.
