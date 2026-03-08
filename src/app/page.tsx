import { redirect } from 'next/navigation'
import { getCurrentUser, getUserWorkouts } from '@/lib/auth-helpers'
import WorkoutList from '@/components/home/WorkoutList'
import { Workout } from '@/lib/workout/types'

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const workouts = await getUserWorkouts(user.id)

  return (
    <WorkoutList
      initialWorkouts={workouts as unknown as Workout[]}
      user={user}
    />
  )
}
