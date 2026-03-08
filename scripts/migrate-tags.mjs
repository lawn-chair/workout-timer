// One-time migration: convert comma-separated tags strings to JSON arrays.
// Run against dev and prod after deploying the tags-json-array schema change.
//
// Usage:
//   node scripts/migrate-tags.mjs
//   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... node scripts/migrate-tags.mjs
import { PrismaClient } from '../src/generated/prisma/index.js'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const url =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  'file:./prisma/dev.db'

const adapter = new PrismaLibSql({ url, authToken: process.env.TURSO_AUTH_TOKEN })
const prisma = new PrismaClient({ adapter })

const workouts = await prisma.workout.findMany()
let updated = 0

for (const w of workouts) {
  if (typeof w.tags === 'string' && w.tags) {
    await prisma.workout.update({
      where: { id: w.id },
      data: { tags: w.tags.split(',').map((t) => t.trim()).filter(Boolean) },
    })
    updated++
  }
}

console.log(`Migrated ${updated} workout(s).`)
await prisma.$disconnect()
