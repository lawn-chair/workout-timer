import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

async function generateUniqueSlug(
  name: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  let slug = baseSlug
  let counter = 0
  while (true) {
    const existing = await prisma.workout.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) break
    counter++
    slug = `${baseSlug}-${counter}`
  }
  return slug
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    const workout = await prisma.workout.findUnique({
      where: { id },
      include: {
        sets: {
          orderBy: { order: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
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
    const { name, description, isPublic, tags, sets } = body

    const updateData: {
      name?: string
      slug?: string
      description?: string | null
      isPublic?: boolean
      tags?: string[]
    } = {}

    if (name !== undefined) {
      updateData.name = name
      updateData.slug = await generateUniqueSlug(name, id)
    }
    if (description !== undefined) updateData.description = description
    if (isPublic !== undefined) updateData.isPublic = isPublic
    if (tags !== undefined) updateData.tags = tags

    if (sets !== undefined) {
      await prisma.setExercise.deleteMany({
        where: { set: { workoutId: id } },
      })
      await prisma.workoutSet.deleteMany({ where: { workoutId: id } })

      const createdSets = await prisma.workoutSet.createManyAndReturn({
        data: sets.map(
          (
            set: {
              repeatCount: number
              restBetweenExercises: number
              restBetweenSets: number
              exercises: { name: string; workDuration: number }[]
            },
            index: number
          ) => ({
            order: index,
            repeatCount: set.repeatCount || 1,
            restBetweenExercises: set.restBetweenExercises || 0,
            restBetweenSets: set.restBetweenSets || 0,
            workoutId: id,
          })
        ),
      })

      createdSets.sort((a, b) => a.order - b.order)

      for (const set of createdSets) {
        const incoming = sets[set.order]
        if (!incoming?.exercises?.length) continue
        await prisma.setExercise.createMany({
          data: incoming.exercises.map(
            (ex: { name: string; workDuration: number }, exIndex: number) => ({
              name: ex.name,
              workDuration: ex.workDuration || 30,
              order: exIndex,
              setId: set.id,
            })
          ),
        })
      }
    }

    const updatedWorkout = await prisma.workout.update({
      where: { id },
      data: updateData,
      include: {
        sets: {
          orderBy: { order: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
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
