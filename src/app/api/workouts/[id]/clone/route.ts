import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sourceWorkout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })

    if (!sourceWorkout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (!sourceWorkout.isPublic) {
      return NextResponse.json(
        { error: 'Cannot clone private workout' },
        { status: 403 }
      )
    }

    const slug = `${sourceWorkout.slug}-${Date.now()}`

    const clonedWorkout = await prisma.workout.create({
      data: {
        name: `${sourceWorkout.name} (Copy)`,
        description: sourceWorkout.description,
        slug,
        tags: sourceWorkout.tags,
        isPublic: false,
        userId: user.id,
        exercises: {
          create: sourceWorkout.exercises.map((ex) => ({
            name: ex.name,
            workDuration: ex.workDuration,
            restDuration: ex.restDuration,
            sets: ex.sets,
            restBetweenSets: ex.restBetweenSets,
            order: ex.order,
          })),
        },
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(clonedWorkout)
  } catch (error) {
    console.error('Error cloning workout:', error)
    return NextResponse.json(
      { error: 'Failed to clone workout' },
      { status: 500 }
    )
  }
}
