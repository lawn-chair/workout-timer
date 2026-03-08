# Plan 03: Server Components for Initial Data Loading

**Effort:** Medium | **Impact:** High | **Priority:** 3

## Problem

`src/app/page.tsx` is a `'use client'` component that:

1. Calls `useSession()` to check auth
2. Redirects to `/login` in a `useEffect` if unauthenticated
3. Calls `fetchWorkouts()` in another `useEffect` after auth is confirmed

This creates a blank → loading → content waterfall and loses Next.js App Router's main benefit: zero-waterfall server-side rendering.

## Solution

Split the page into:

- An **async server component** (`page.tsx`) that handles auth and fetches workouts server-side
- A **client component** (`WorkoutList.tsx`) that receives workouts as props and handles interactive UI

The server component uses `redirect()` from `next/navigation` for unauthenticated users, so no client-side redirect is needed.

`getUserWorkouts()` already exists in `src/lib/auth-helpers.ts` and queries Prisma directly.

---

## Architecture

```
src/app/page.tsx          ← async server component (auth + data fetch)
src/components/home/
  WorkoutList.tsx          ← 'use client' (interactive list, delete, start, tag filter)
```

---

## Step-by-Step Changes

### 1. `src/app/page.tsx` — Convert to async server component

Remove `'use client'` directive. Remove `useSession`, `useEffect`, `useRouter`. Add `redirect()` for unauthed users.

```tsx
import { redirect } from 'next/navigation'
import { getCurrentUser, getUserWorkouts } from '@/lib/auth-helpers'
import WorkoutList from '@/components/home/WorkoutList'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workouts = await getUserWorkouts(user.id)

  return <WorkoutList initialWorkouts={workouts} user={user} />
}
```

Notes:

- `getCurrentUser()` calls `getServerSession()` which works in server components.
- `getUserWorkouts()` queries Prisma directly — no HTTP round-trip.
- The page renders with data immediately; no client-side loading state needed for the initial list.

### 2. Create `src/components/home/WorkoutList.tsx` — Client component

Move the entire JSX from the current `page.tsx` into this component. It receives `initialWorkouts` and `user` as props.

Key changes from the current `page.tsx`:

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTimerStore } from '@/lib/timer/store'
import { Workout } from '@/lib/workout/types'
// ... other imports

interface Props {
  initialWorkouts: Workout[]
  user: { id: string; name?: string | null; email?: string | null; image?: string | null }
}

export default function WorkoutList({ initialWorkouts, user }: Props) {
  const router = useRouter()
  const loadWorkout = useTimerStore((s) => s.loadWorkout)
  const [workouts, setWorkouts] = useState(initialWorkouts)
  // ... rest of the state and JSX
```

**Mutations (delete, etc.):**

Without TanStack Query (Plan 04), mutations need to call the API directly and update local state:

```ts
const handleDelete = async (id: string, e: React.MouseEvent) => {
  e.preventDefault()
  if (!confirm('Delete this workout?')) return
  await deleteWorkout(id) // from api.ts
  setWorkouts((prev) => prev.filter((w) => w.id !== id))
}
```

After Plan 04 (TanStack Query) is implemented, these local state updates can be replaced with `useMutation` + `invalidateQueries`.

**Public workouts:**

Public workouts are loaded client-side on demand (when user clicks "Browse Public") — this stays as a `useState` + `fetch` pattern since it's not critical path content. No change needed there.

**Loading state:**

The initial loading state (`if (status === 'loading' || isLoading)`) can be removed entirely for the server-rendered workouts. A loading state is only needed for the public workouts fetch.

### 3. Update `Workout` type import

`WorkoutList.tsx` should import from `@/lib/workout/types` directly, not from `@/lib/workout/store`. The store is only needed if mutations go through it (see Plan 04 to replace this entirely).

### 4. Consider `src/app/workouts/[id]/edit/page.tsx`

This page also fetches data client-side in a `useEffect`. It can be similarly converted:

```tsx
// src/app/workouts/[id]/edit/page.tsx (server component wrapper)
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import EditWorkoutForm from '@/components/workout/EditWorkoutForm'
import { notFound } from 'next/navigation'

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await requireAuth()

  const workout = await prisma.workout.findUnique({
    where: { id, userId: user.id },
    include: {
      sets: {
        orderBy: { order: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!workout) notFound()

  return <EditWorkoutForm workout={workout} />
}
```

Move the form JSX into `src/components/workout/EditWorkoutForm.tsx` as a client component.

---

## Files Changed

| File                                         | Change                                                   |
| -------------------------------------------- | -------------------------------------------------------- |
| `src/app/page.tsx`                           | Remove `'use client'`, convert to async server component |
| `src/components/home/WorkoutList.tsx`        | New client component with all interactive home page UI   |
| `src/app/workouts/[id]/edit/page.tsx`        | Optional: convert to server component                    |
| `src/components/workout/EditWorkoutForm.tsx` | Optional: new client component for edit form             |

### 5. Convert `src/app/w/[slug]/page.tsx` to a server component

This is a **publicly shareable URL** — it should be server-rendered for SEO (meta tags, Open Graph), faster first paint, and to eliminate the loading spinner. The public workout detail page currently fetches client-side via `useEffect`, but it can query Prisma directly like the other server components.

```tsx
// src/app/w/[slug]/page.tsx (server component)
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import PublicWorkoutView from '@/components/workout/PublicWorkoutView'

export default async function PublicWorkoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const workout = await prisma.workout.findFirst({
    where: {
      OR: [{ id: slug }, { slug }],
      isPublic: true,
    },
    include: {
      sets: {
        orderBy: { order: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!workout) notFound()

  return <PublicWorkoutView workout={workout} />
}
```

Move the interactive parts (clone button, start button) into `src/components/workout/PublicWorkoutView.tsx` as a `'use client'` component. The workout data is passed as a prop — no loading spinner needed.

This also enables adding `generateMetadata()` for Open Graph tags:

```ts
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const workout = await prisma.workout.findFirst({
    where: { OR: [{ id: slug }, { slug }], isPublic: true },
    select: { name: true, description: true },
  })
  if (!workout) return {}
  return {
    title: `${workout.name} — Workout Timer`,
    description: workout.description || 'A shared workout routine.',
  }
}
```

---

## Files Changed

| File                                           | Change                                                   |
| ---------------------------------------------- | -------------------------------------------------------- |
| `src/app/page.tsx`                             | Remove `'use client'`, convert to async server component |
| `src/components/home/WorkoutList.tsx`          | New client component with all interactive home page UI   |
| `src/app/workouts/[id]/edit/page.tsx`          | Convert to server component                              |
| `src/components/workout/EditWorkoutForm.tsx`   | New client component for edit form                       |
| `src/app/w/[slug]/page.tsx`                    | Convert to server component, add `generateMetadata`      |
| `src/components/workout/PublicWorkoutView.tsx` | New client component for public workout interactive UI   |

---

## Testing

After this change:

- View source / disable JS: the workout list HTML should be present in the initial response (not injected by JS)
- Network tab: no `/api/workouts` fetch on initial page load
- Auth redirect: navigating to `/` unauthenticated should redirect instantly (no flash of loading state)
- Public workout page: share a `/w/my-workout` URL — the HTML should include workout details without JS execution
- Open Graph: sharing the URL on Slack/Twitter should show the workout name and description
