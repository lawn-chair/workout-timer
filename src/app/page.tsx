'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Workout,
  getWorkouts,
  seedSampleWorkouts,
  deleteWorkout,
} from '@/lib/workout/store'
import { useTimerStore } from '@/lib/timer/store'

export default function Home() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const loadWorkout = useTimerStore((s) => s.loadWorkout)

  useEffect(() => {
    seedSampleWorkouts()
    setWorkouts(getWorkouts())
    setLoading(false)
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this workout?')) return
    deleteWorkout(id)
    setWorkouts(getWorkouts())
  }

  const handleStart = (workout: Workout) => {
    loadWorkout({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      exercises: workout.exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        workDuration: ex.workDuration,
        restDuration: ex.restDuration,
        sets: ex.sets,
        restBetweenSets: ex.restBetweenSets,
      })),
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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Workout Timer</h1>
          <Link
            href="/workouts/new"
            className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium"
            data-testid="new-workout-button"
          >
            + New Workout
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {workouts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">No workouts yet</p>
            <Link
              href="/workouts/new"
              className="text-green-500 hover:text-green-400"
            >
              Create your first workout
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workouts.map((workout) => (
              <div
                key={workout.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors"
                data-testid={`workout-card-${workout.id}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold">{workout.name}</h2>
                    {workout.description && (
                      <p className="text-gray-400 text-sm mt-1">
                        {workout.description}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-sm text-gray-500">
                      <span>{workout.exercises.length} exercises</span>
                      <span>
                        {workout.exercises.reduce(
                          (sum, ex) => sum + ex.sets,
                          0
                        )}{' '}
                        total sets
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleStart(workout)}
                      className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-lg font-medium"
                      data-testid={`start-workout-${workout.id}`}
                    >
                      Start
                    </button>
                    <Link
                      href={`/workouts/${workout.id}/edit`}
                      className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
                      data-testid={`edit-workout-${workout.id}`}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={(e) => handleDelete(workout.id, e)}
                      className="bg-red-900 hover:bg-red-800 px-4 py-2 rounded-lg text-red-200"
                      data-testid={`delete-workout-${workout.id}`}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
