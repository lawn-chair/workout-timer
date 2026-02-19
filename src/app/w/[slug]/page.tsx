'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Workout } from '@/lib/workout/types'
import { fetchPublicWorkout, cloneWorkout } from '@/lib/workout/api'
import { useTimerStore } from '@/lib/timer/store'

export default function PublicWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cloning, setCloning] = useState(false)
  const loadWorkout = useTimerStore((s) => s.loadWorkout)

  useEffect(() => {
    const id = params.slug as string
    fetchPublicWorkout(id)
      .then(setWorkout)
      .catch(() => setError('Workout not found'))
      .finally(() => setLoading(false))
  }, [params.slug])

  const handleClone = async () => {
    if (!session) {
      router.push('/login')
      return
    }
    if (!workout) return

    setCloning(true)
    try {
      const cloned = await cloneWorkout(workout.id)
      router.push(`/workouts/${cloned.id}/edit`)
    } catch {
      alert('Failed to clone workout')
    } finally {
      setCloning(false)
    }
  }

  const handleStart = () => {
    if (!workout) return
    loadWorkout({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      sets: workout.sets,
    })
    router.push('/timer')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">Workout not found</h1>
          <Link href="/" className="text-green-500 hover:text-green-400">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            Workout Timer
          </Link>
          {session && (
            <Link
              href="/"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
            >
              My Workouts
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{workout.name}</h1>
          {workout.description && (
            <p className="text-gray-400 mb-4">{workout.description}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleStart}
              className="bg-green-500 hover:bg-green-600 px-6 py-3 rounded-lg font-medium"
            >
              Start Workout
            </button>
            {session ? (
              <button
                onClick={handleClone}
                disabled={cloning}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {cloning ? 'Cloning...' : 'Clone to My Workouts'}
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-medium"
              >
                Sign in to Clone
              </Link>
            )}
          </div>
        </div>

        <h2 className="text-xl font-bold mb-4">Sets</h2>
        <div className="space-y-3">
          {workout.sets.map((set, setIndex) => (
            <div key={set.id} className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">Set {setIndex + 1}</h3>
                  <div className="text-gray-400 text-sm mt-1">
                    <span>{set.exercises.length} exercises</span>
                    <span className="mx-2">•</span>
                    <span>Repeat {set.repeatCount}x</span>
                    {set.restBetweenExercises > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>
                          {set.restBetweenExercises}s between exercises
                        </span>
                      </>
                    )}
                    {set.restBetweenSets > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{set.restBetweenSets}s between sets</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {set.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="text-gray-300 text-sm">
                    {index + 1}. {exercise.name} · {exercise.workDuration}s work
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
