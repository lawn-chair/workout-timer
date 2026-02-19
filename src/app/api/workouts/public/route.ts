import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const workouts = await prisma.workout.findMany({
      where: { isPublic: true },
      include: { exercises: { orderBy: { order: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching public workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}
