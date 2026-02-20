import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('TURSO_DATABASE_URL is required to apply migrations.')
  process.exit(1)
}

const client = createClient({
  url,
  authToken,
})

const migrationsDir = path.resolve(__dirname, '..', 'prisma', 'migrations')
const migrationDirs = fs
  .readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort()

await client.execute(
  'CREATE TABLE IF NOT EXISTS _app_migrations (id TEXT PRIMARY KEY, applied_at TEXT NOT NULL)'
)

const appliedResult = await client.execute('SELECT id FROM _app_migrations')
const applied = new Set(appliedResult.rows.map((row) => row.id))

for (const migrationId of migrationDirs) {
  if (applied.has(migrationId)) {
    continue
  }

  const migrationPath = path.join(migrationsDir, migrationId, 'migration.sql')
  if (!fs.existsSync(migrationPath)) {
    console.warn(`Skipping ${migrationId}: migration.sql not found.`)
    continue
  }

  const rawSql = fs.readFileSync(migrationPath, 'utf8')
  const statements = rawSql
    .split('\n')
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean)

  for (const statement of statements) {
    await client.execute(statement)
  }

  await client.execute({
    sql: 'INSERT INTO _app_migrations (id, applied_at) VALUES (?, ?)',
    args: [migrationId, new Date().toISOString()],
  })
}

await client.close()
