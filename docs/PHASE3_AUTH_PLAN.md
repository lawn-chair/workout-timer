# Phase 3: User Accounts & Sync

## Overview

Add authentication, user-owned workouts, public sharing, and settings.

## Current State

- **Phase 1**: Timer core (complete)
- **Phase 2**: Workout CRUD (complete)
- **This Phase**: Auth, sync, sharing

## Features

| Feature                 | Description                                           |
| ----------------------- | ----------------------------------------------------- |
| **Google OAuth**        | NextAuth.js with Google provider                      |
| **User-owned Workouts** | Only owner can edit/delete                            |
| **REST API**            | CRUD endpoints for workouts                           |
| **Public/Private**      | `isPublic` toggle, view-only for others               |
| **Cloning**             | Copy public workouts to your account                  |
| **Tags**                | Add categories to workouts (e.g., "HIIT", "Strength") |

## Implementation Steps

### Step 1: Setup NextAuth with Google OAuth

- Install dependencies: `npm i next-auth @next-auth/prisma-adapter`
- Configure Google OAuth in console.cloud.google.com
- Add `NEXTAUTH_SECRET` and `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` to `.env`
- Create `src/lib/auth.ts` - NextAuth configuration
- Create `src/app/api/auth/[...nextauth]/route.ts`
- Add AuthProvider wrapper
- Create `/login` page with Google sign-in button
- **Commit**: "Add NextAuth.js with Google OAuth"

### Step 2: Update Prisma Schema

- Add `tags String[]` to Workout model
- Add `slug String? @unique` to Workout model
- Run `npx prisma db push`
- Regenerate Prisma client
- **Commit**: "Add tags and slug to Workout model"

### Step 3: Create Workout API Routes

| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| GET    | `/api/workouts`             | List user's workouts |
| POST   | `/api/workouts`             | Create workout       |
| GET    | `/api/workouts/[id]`        | Get single workout   |
| PATCH  | `/api/workouts/[id]`        | Update workout       |
| DELETE | `/api/workouts/[id]`        | Delete workout       |
| POST   | `/api/workouts/[id]/clone`  | Clone public workout |
| GET    | `/api/workouts/public`      | List public workouts |
| GET    | `/api/workouts/public/[id]` | View public workout  |
| GET    | `/api/settings`             | Get user settings    |
| PATCH  | `/api/settings`             | Update user settings |

- **Commit**: "Add REST API routes for workouts"

### Step 4: Update Workout Store for Auth

- Update `src/lib/workout/store.ts` to use API
- Add auth-aware methods
- Handle loading/error states
- **Commit**: "Update workout store with auth-aware API methods"

### Step 5: Add Clone Functionality

- Add "Clone" button on public workout view
- Create `/w/[slug]` public view page
- **Commit**: "Add public workout view and clone functionality"

### Step 6: Add Tags to UI

- Add tag input to workout builder
- Display tags on workout cards
- Filter by tags on home page
- **Commit**: "Add tags to workout builder and home page"

### Step 7: Create Settings Page

- GET/PATCH `/api/settings`
- Create `/settings` page with preferences
- **Commit**: "Add user settings page"

### Step 8: Final Integration & Tests

- End-to-end testing flow
- Run full `npm run check`
- **Commit**: "Phase 3: Add auth, public sharing, and settings"

### Step 9: Create Pull Request

- Push branch to remote
- Create PR with description

---

## Testing Checklist

- [ ] Login/logout flow works
- [ ] Unauthenticated users can't create/edit workouts
- [ ] Users can only edit their own workouts
- [ ] Public workouts viewable by anyone
- [ ] Clone copies workout to user's account
- [ ] Tags filter works on home page
- [ ] Settings persist correctly

## API Authorization Rules

| Action                    | Owner          | Other User | Anonymous |
| ------------------------- | -------------- | ---------- | --------- |
| View own private workouts | ✅             | -          | -         |
| Edit own workouts         | ✅             | -          | -         |
| Delete own workouts       | ✅             | -          | -         |
| View public workouts      | ✅             | ✅         | ✅        |
| Create workouts           | ✅ (auth only) | -          | ❌        |
