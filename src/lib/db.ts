import { PrismaClient } from '@/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const explicitUrl = process.env.TURSO_DATABASE_URL ?? process.env.DATABASE_URL
  const isTestEnv =
    process.env.NODE_ENV === 'test' || process.env.VITEST === 'true'
  const isE2E = process.env.E2E_TESTING === 'true'

  const url =
    explicitUrl ||
    (isTestEnv ? 'file:./test.db' : isE2E ? 'file:./e2e.db' : 'file:./dev.db')

  const adapter = new PrismaLibSql({
    url,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
