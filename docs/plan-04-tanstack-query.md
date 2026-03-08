# Plan 04: TanStack Query for Server State

**Effort:** Medium | **Impact:** High | **Priority:** 4

## Problem

`src/lib/workout/store.ts` is a Zustand store managing server state: a list fetched from an API with manual loading/error flags. This duplicates functionality that a dedicated server-state library provides for free:

- No caching between page navigations
- No background revalidation
- No request deduplication
- Loading/error state is manual boilerplate
- Mutations require manual optimistic updates

Zustand is the right tool for the **timer store** (pure client state with no server involvement). It's the wrong tool for **workout CRUD** (server state).

## Solution

Install TanStack Query and replace the workout Zustand store with query/mutation hooks. The `api.ts` functions are kept unchanged — they become the `queryFn`/`mutationFn` values.

---

## Installation

```bash
npm install @tanstack/react-query
```

For devtools (optional but recommended):

```bash
npm install @tanstack/react-query-devtools
```

---

## Step-by-Step Changes

### 1. `src/app/layout.tsx` — Add `QueryClientProvider`

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Wrap the existing layout body:

```diff
  export default function RootLayout({ children }) {
    return (
      <html lang="en" suppressHydrationWarning>
        <body ...>
          <ThemeProvider>
-           <AuthProvider>{children}</AuthProvider>
+           <Providers>
+             <AuthProvider>{children}</AuthProvider>
+           </Providers>
          </ThemeProvider>
          <Analytics />
          <ServiceWorkerRegister />
        </body>
      </html>
    )
  }
```

Since `layout.tsx` is currently a server component, extract the `Providers` wrapper into a separate `'use client'` file: `src/components/providers/QueryProvider.tsx`.

### 2. Create `src/lib/workout/queries.ts` — Query and mutation hooks

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { WorkoutFormData } from './types'

export const workoutKeys = {
  all: ['workouts'] as const,
  detail: (id: string) => ['workouts', id] as const,
}

export function useWorkouts() {
  return useQuery({
    queryKey: workoutKeys.all,
    queryFn: api.fetchWorkouts,
  })
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => api.fetchWorkout(id),
  })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkoutFormData) => api.createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useUpdateWorkout(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkoutFormData) => api.updateWorkout(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workoutKeys.detail(id), updated)
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteWorkout(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: workoutKeys.all })
      const prev = queryClient.getQueryData(workoutKeys.all)
      queryClient.setQueryData(workoutKeys.all, (old: typeof prev) =>
        Array.isArray(old) ? old.filter((w) => w.id !== id) : old
      )
      return { prev }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(workoutKeys.all, context?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useCloneWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cloneWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}
```

### 3. Update `src/components/home/WorkoutList.tsx` (from Plan 03)

Replace manual state and store calls with query hooks:

```diff
-import { useWorkoutStore } from '@/lib/workout/store'
+import { useWorkouts, useDeleteWorkout } from '@/lib/workout/queries'

  export default function WorkoutList({ initialWorkouts, user }: Props) {
-   const [workouts, setWorkouts] = useState(initialWorkouts)
-   const { isLoading, deleteWorkout } = useWorkoutStore()
+   const { data: workouts = initialWorkouts, isLoading } = useWorkouts()
+   const deleteMutation = useDeleteWorkout()

    const handleDelete = async (id: string, e: React.MouseEvent) => {
      e.preventDefault()
      if (!confirm('Delete this workout?')) return
-     await deleteWorkout(id)
-     setWorkouts((prev) => prev.filter((w) => w.id !== id))
+     deleteMutation.mutate(id)
    }
```

Using `initialWorkouts` as the `initialData` option gives instant display from the server render, with background revalidation:

```ts
const { data: workouts = [] } = useWorkouts({
  initialData: initialWorkouts,
})
```

Or pass it via TanStack Query's `initialData`:

```ts
useQuery({
  queryKey: workoutKeys.all,
  queryFn: api.fetchWorkouts,
  initialData: initialWorkouts,
})
```

### 4. Update `src/app/workouts/new/page.tsx`

```diff
-import { useWorkoutStore, WorkoutFormData } from '@/lib/workout/store'
+import { useCreateWorkout } from '@/lib/workout/queries'
+import { WorkoutFormData } from '@/lib/workout/types'

  export default function NewWorkoutPage() {
-   const { createWorkout } = useWorkoutStore()
+   const createMutation = useCreateWorkout()

    const handleSubmit = async (e: React.FormEvent) => {
      ...
-     await createWorkout(data)
+     await createMutation.mutateAsync(data)
      router.push('/')
    }
```

### 5. Update `src/app/workouts/[id]/edit/page.tsx` (or `EditWorkoutForm.tsx` from Plan 03)

```diff
-import { useWorkoutStore, WorkoutFormData } from '@/lib/workout/store'
+import { useUpdateWorkout } from '@/lib/workout/queries'
+import { WorkoutFormData } from '@/lib/workout/types'

-   const { updateWorkout } = useWorkoutStore()
+   const updateMutation = useUpdateWorkout(id)

    const handleSubmit = async (e: React.FormEvent) => {
      ...
-     await updateWorkout(id, data)
+     await updateMutation.mutateAsync(data)
      router.push('/')
    }
```

### 6. Delete `src/lib/workout/store.ts`

Once all consumers are migrated to query hooks, the file can be deleted. The utility functions at the bottom (`getWorkouts`, `getWorkout`, `createWorkout`, etc.) are no longer needed.

Keep `src/lib/workout/api.ts` — it becomes the source of truth for HTTP functions.

---

## Files Changed

| File                                         | Change                                         |
| -------------------------------------------- | ---------------------------------------------- |
| `package.json`                               | Add `@tanstack/react-query`                    |
| `src/app/layout.tsx`                         | Add `QueryClientProvider` wrapper              |
| `src/components/providers/QueryProvider.tsx` | New: `'use client'` wrapper with `QueryClient` |
| `src/lib/workout/queries.ts`                 | New: all query/mutation hooks                  |
| `src/lib/workout/store.ts`                   | Delete                                         |
| `src/components/home/WorkoutList.tsx`        | Use `useWorkouts`, `useDeleteWorkout`          |
| `src/app/workouts/new/page.tsx`              | Use `useCreateWorkout`                         |
| `src/app/workouts/[id]/edit/page.tsx`        | Use `useUpdateWorkout`                         |

---

## Notes

- Plan 03 (server components) should be implemented first. The `initialData` pattern for `useWorkouts` depends on having server-rendered data to pass in.
- TanStack Query handles its own loading/error states — remove manual `isLoading`/`error` state from components.
- The `staleTime: 60_000` default means data won't re-fetch on every focus change, which is appropriate for workout data.
