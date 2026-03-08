// One-time migration: convert comma-separated tags strings to JSON arrays.
// Run against dev and prod after deploying the tags-json-array schema change.
//
// Usage:
//   node scripts/migrate-tags.mjs
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-tags.mjs
//
// NOTE: Uses raw SQL to bypass Prisma's JSON parsing, which fails on rows
// that still contain non-JSON tag strings like "rehab" or "rehab,strength".
import { createClient } from '@libsql/client'

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'file:./prisma/dev.db'

const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Read raw tag values — bypasses Prisma's JSON.parse
const { rows } = await client.execute('SELECT id, tags FROM "Workout"')

let updated = 0

for (const row of rows) {
  const rawTags = row.tags

  // Already valid JSON array — skip
  if (typeof rawTags === 'string' && rawTags.trimStart().startsWith('[')) {
    continue
  }

  // Empty / null — write empty array
  if (!rawTags) {
    await client.execute({
      sql: 'UPDATE "Workout" SET tags = ? WHERE id = ?',
      args: ['[]', row.id],
    })
    updated++
    continue
  }

  // Plain string like "rehab" or "rehab,strength" — convert to JSON array
  const arr = String(rawTags)
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  await client.execute({
    sql: 'UPDATE "Workout" SET tags = ? WHERE id = ?',
    args: [JSON.stringify(arr), row.id],
  })
  updated++
}

console.log(`Migrated ${updated} workout(s).`)
await client.close()
