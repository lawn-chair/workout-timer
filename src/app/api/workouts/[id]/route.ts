import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: { exercises: { orderBy: { order: 'asc' } } },
    })

    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.userId !== user?.id && !workout.isPublic) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error fetching workout:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workout = await prisma.workout.findUnique({ where: { id } })
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, isPublic, tags, exercises } = body

    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      isPublic?: boolean
      tags?: string
    } = {}

    if (name !== undefined) {
      updateData.name = name
      updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    }
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (tags !== undefined) updateData.tags = tags

    if (exercises !== undefined) {
      await prisma.exercise.deleteMany({ where: { workoutId: id } })
      await prisma.exercise.createMany({
        data: exercises.map(
          (
            ex: {
              name: string
              workDuration: number
              restDuration: number
              sets: number
              restBetweenSets: number
            },
            index: number
          ) => ({
            name: ex.name,
            workDuration: ex.workDuration || 30,
            restDuration: ex.restDuration || 10,
            sets: ex.sets || 1,
            restBetweenSets: ex.restBetweenSets || 60,
            order: index,
            workoutId: id,
          })
        ),
      })
    }

    const updatedWorkout = await prisma.workout.update({
      where: { id },
      data: updateData,
      include: { exercises: { orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(updatedWorkout)
  } catch (error) {
    console.error('Error updating workout:', error)
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workout = await prisma.workout.findUnique({ where: { id } })
    if (!workout) {
      return NextResponse.json({ error: 'Workout not found' }, { status: 404 })
    }

    if (workout.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.workout.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    )
  }
}
