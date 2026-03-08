import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import PublicWorkoutView from '@/components/workout/PublicWorkoutView'
import { Workout } from '@/lib/workout/types'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const workout = await prisma.workout.findFirst({
    where: { OR: [{ id: slug }, { slug }], isPublic: true },
    select: { name: true, description: true },
  })
  if (!workout) return {}
  return {
    title: `${workout.name} — Workout Timer`,
    description: workout.description || 'A shared workout routine.',
  }
}

export default async function PublicWorkoutPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const workout = await prisma.workout.findFirst({
    where: {
      OR: [{ id: slug }, { slug }],
      isPublic: true,
    },
    include: {
      sets: {
        orderBy: { order: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!workout) notFound()

  return <PublicWorkoutView workout={workout as unknown as Workout} />
}
