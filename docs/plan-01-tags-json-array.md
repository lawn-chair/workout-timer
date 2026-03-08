# Plan 01: Tags as JSON Array

**Effort:** Low | **Impact:** Medium | **Priority:** 1

## Problem

`tags String @default("")` in the `Workout` model stores tags as a comma-separated string (e.g. `"strength,cardio"`). All tag parsing happens in JavaScript on the client:

```ts
// src/app/page.tsx
workouts.flatMap((w) =>
  (w.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
)
```

This makes DB-level filtering impossible and is fragile (spaces, inconsistent casing).

## Solution

Change to `String[]` — Prisma 7 with the LibSQL adapter (already in use) stores this as a JSON array natively. This is a schema change + migration + find/replace across tag-handling code.

---

## Step-by-Step Changes

### 1. `prisma/schema.prisma`

```diff
-  tags        String     @default("")
+  tags        String[]   @default([])
```

### 2. Run migration

```bash
npx prisma migrate dev --name tags-json-array
```

> If using Turso in prod, apply via the existing `apply-turso-migrations.mjs` script.

### 3. `src/lib/workout/types.ts`

```diff
  export interface Workout {
    ...
-   tags?: string
+   tags?: string[]
    ...
  }

  export interface WorkoutFormData {
    ...
-   tags?: string
+   tags?: string[]
    ...
  }
```

### 4. `src/app/api/workouts/route.ts` — POST handler

```diff
-   tags: tags || '',
+   tags: Array.isArray(tags) ? tags : [],
```

### 5. `src/app/api/workouts/[id]/route.ts` — PATCH handler

Type annotation for `updateData`:

```diff
-   tags?: string
+   tags?: string[]
```

Value assignment (no change needed — `if (tags !== undefined) updateData.tags = tags` stays the same, but the client must now send an array).

### 6. `src/app/page.tsx` — Tag parsing

Replace comma-split logic with direct array access:

```diff
// allTags memo
-  workouts.flatMap((w) =>
-    (w.tags || '').split(',').map((t) => t.trim()).filter(Boolean)
-  )
+  workouts.flatMap((w) => w.tags ?? [])

// filteredWorkouts memo
-  workouts.filter((w) =>
-    (w.tags || '').split(',').map((t) => t.trim()).includes(selectedTag)
-  )
+  workouts.filter((w) => (w.tags ?? []).includes(selectedTag))

// Tag chip rendering (inline in JSX)
-  workout.tags.split(',').map((t) => t.trim()).filter(Boolean).map(...)
+  workout.tags.map(...)
```

Remove `workout.tags &&` guard if tags is always `string[]` (it will be `[]` not `undefined`). Keep it for backwards compat if old records may still be null.

### 7. `src/app/workouts/new/page.tsx` — Form state

The tag input is currently a freeform string. Convert it to send an array:

```diff
  const [tags, setTags] = useState('')

  // In handleSubmit:
-   tags: tags.trim() || undefined,
+   tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
```

No UI change needed — the label already says "comma-separated". The split happens on submit.

### 8. `src/app/workouts/[id]/edit/page.tsx` — Load and save

```diff
  // When loading workout into state:
-   setTags(workout.tags || '')
+   setTags((workout.tags ?? []).join(', '))

  // In handleSubmit:
-   tags: tags.trim() || undefined,
+   tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
```

---

## Data Migration Note

Existing rows have `tags` as a comma-separated string. After the schema migration, Prisma/LibSQL will store the column as JSON. Existing rows with string values will need a one-time data migration:

```sql
-- Run this once against dev and prod DBs after the schema migration
UPDATE Workout
SET tags = json_array(
  -- split the string manually; SQLite doesn't have split_part natively
  -- simplest approach: run a Node script instead
)
WHERE tags != '[]' AND tags != '';
```

**Recommended:** Write a small migration script `scripts/migrate-tags.mjs` that:

1. Fetches all workouts with non-empty string tags
2. Parses and re-saves them as arrays via Prisma

```js
// scripts/migrate-tags.mjs
import { PrismaClient } from '../src/generated/prisma/index.js'
const prisma = new PrismaClient()
const workouts = await prisma.workout.findMany()
for (const w of workouts) {
  if (typeof w.tags === 'string' && w.tags) {
    await prisma.workout.update({
      where: { id: w.id },
      data: {
        tags: w.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      },
    })
  }
}
await prisma.$disconnect()
```

---

## Files Changed

| File                                  | Change                                       |
| ------------------------------------- | -------------------------------------------- |
| `prisma/schema.prisma`                | `String` → `String[]`                        |
| `src/lib/workout/types.ts`            | `tags?: string` → `tags?: string[]`          |
| `src/app/api/workouts/route.ts`       | Normalize tags on create                     |
| `src/app/api/workouts/[id]/route.ts`  | Type annotation update                       |
| `src/app/page.tsx`                    | Remove split/trim/filter, use array directly |
| `src/app/workouts/new/page.tsx`       | Split on submit                              |
| `src/app/workouts/[id]/edit/page.tsx` | Join on load, split on submit                |
| `scripts/migrate-tags.mjs`            | One-time data migration (new file)           |
