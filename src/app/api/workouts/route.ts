import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { validateWorkoutInput } from '@/lib/workout/validation'

async function generateUniqueSlug(name: string): Promise<string> {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  let slug = baseSlug
  let counter = 0
  while (await prisma.workout.findUnique({ where: { slug } })) {
    counter++
    slug = `${baseSlug}-${counter}`
  }
  return slug
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workouts = await prisma.workout.findMany({
      where: { userId: user.id },
      include: {
        sets: {
          orderBy: { order: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(workouts)
  } catch (error) {
    console.error('Error fetching workouts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateWorkoutInput(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', errors: validation.errors },
        { status: 400 }
      )
    }

    const { name, description, isPublic, tags, sets } = validation.data

    const slug = await generateUniqueSlug(name)

    const workout = await prisma.workout.create({
      data: {
        name,
        description,
        slug,
        tags: Array.isArray(tags) ? tags : [],
        isPublic: isPublic || false,
        userId: user.id,
        sets: sets
          ? {
              create: sets.map(
                (
                  set: {
                    repeatCount: number
                    restBetweenExercises: number
                    restBetweenRepeats: number
                    restBetweenSets: number
                    exercises: { name: string; workDuration: number }[]
                  },
                  setIndex: number
                ) => ({
                  order: setIndex,
                  repeatCount: set.repeatCount || 1,
                  restBetweenExercises: set.restBetweenExercises || 0,
                  restBetweenRepeats: set.restBetweenRepeats || 0,
                  restBetweenSets: set.restBetweenSets || 0,
                  exercises: {
                    create: set.exercises.map((ex, exIndex) => ({
                      name: ex.name,
                      workDuration: ex.workDuration || 30,
                      order: exIndex,
                    })),
                  },
                })
              ),
            }
          : undefined,
      },
      include: {
        sets: {
          orderBy: { order: 'asc' },
          include: { exercises: { orderBy: { order: 'asc' } } },
        },
      },
    })

    return NextResponse.json(workout)
  } catch (error) {
    console.error('Error creating workout:', error)
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    )
  }
}
