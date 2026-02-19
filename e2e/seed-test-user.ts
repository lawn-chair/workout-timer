import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
})
const prisma = new PrismaClient({ adapter })

async function seed() {
  // Upsert test user
  const user = await prisma.user.upsert({
    where: { email: 'e2e-test@example.com' },
    update: { name: 'E2E Test User' },
    create: { email: 'e2e-test@example.com', name: 'E2E Test User' },
  })

  // Clean up any leftover workouts from previous test runs
  await prisma.workout.deleteMany({
    where: { userId: user.id },
  })

  console.log('Test user seeded:', user.id)
  await prisma.$disconnect()
}

seed()
