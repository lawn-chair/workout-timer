import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

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
      include: { exercises: { orderBy: { order: 'asc' } } },
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
    const { name, description, isPublic, tags, exercises } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const slug = await generateUniqueSlug(name)

    const workout = await prisma.workout.create({
      data: {
        name,
        description,
        slug,
        tags: tags || '',
        isPublic: isPublic || false,
        userId: user.id,
        exercises: exercises
          ? {
              create: exercises.map(
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
                })
              ),
            }
          : undefined,
      },
      include: { exercises: { orderBy: { order: 'asc' } } },
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
