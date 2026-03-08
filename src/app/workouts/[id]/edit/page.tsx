import { notFound } from 'next/navigation'
import { requireAuth } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import EditWorkoutForm from '@/components/workout/EditWorkoutForm'

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  await requireAuth()

  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      sets: {
        orderBy: { order: 'asc' },
        include: { exercises: { orderBy: { order: 'asc' } } },
      },
    },
  })

  if (!workout) notFound()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <EditWorkoutForm workout={workout as any} />
}
