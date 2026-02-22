import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    workout: {
      findMany: vi.fn(),
    },
  },
}))

import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/db'
import { getCurrentUser, requireAuth, getUserWorkouts } from './auth-helpers'

describe('auth helpers', () => {
  it('returns null when session missing', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    await expect(getCurrentUser()).resolves.toBeNull()
  })

  it('returns session user with id', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 'user-1', email: 'user@example.com' },
    } as { user: { id: string; email?: string } })

    await expect(getCurrentUser()).resolves.toEqual({
      id: 'user-1',
      email: 'user@example.com',
    })
  })

  it('hydrates user id by email lookup', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { email: 'user@example.com' },
    } as { user: { email: string } })

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user-2',
      email: 'user@example.com',
      name: null,
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Awaited<ReturnType<typeof prisma.user.findUnique>>)

    await expect(getCurrentUser()).resolves.toEqual({
      email: 'user@example.com',
      id: 'user-2',
    })
  })

  it('requireAuth throws when unauthorized', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null)

    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  it('getUserWorkouts queries prisma with includes', async () => {
    vi.mocked(prisma.workout.findMany).mockResolvedValue([])

    await getUserWorkouts('user-1')

    expect(prisma.workout.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      include: {
        sets: {
          orderBy: { order: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })
})
