import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return null
  }

  if (session.user.id) {
    return session.user
  }

  if (session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })
    if (!user) return null
    return { ...session.user, id: user.id }
  }

  return null
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
    include: {
      sets: {
        orderBy: { order: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })
}
