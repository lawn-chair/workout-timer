import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return null
  }
  return session.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export async function getUserWorkouts(userId: string) {
  return prisma.workout.findMany({
    where: { userId },
    include: { exercises: { orderBy: { order: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  })
}
