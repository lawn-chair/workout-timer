'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { cloneWorkout } from '@/lib/workout/api'
import { useTimerStore } from '@/lib/timer/store'
import { Workout } from '@/lib/workout/types'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'

export default function PublicWorkoutView({ workout }: { workout: Workout }) {
  const router = useRouter()
  const { data: session } = useSession()
  const [cloning, setCloning] = useState(false)
  const loadWorkout = useTimerStore((s) => s.loadWorkout)

  const handleClone = async () => {
    if (!session) {
      router.push('/login')
      return
    }
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
    loadWorkout({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      sets: workout.sets,
    })
    router.push('/timer')
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="border-b border-white/5 bg-black/30">
          <div className="max-w-4xl mx-auto px-5 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-lime-400/20 text-lime-300 flex items-center justify-center">
                <IconMark className="h-6 w-6" />
              </div>
              <Link href="/" className="display-font text-3xl">
                Workout Timer
              </Link>
            </div>
            {session && (
              <Link
                href="/"
                className="ghost-button px-4 py-2 rounded-full text-sm"
              >
                My Workouts
              </Link>
            )}
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-5 py-8">
          <div className="glass-panel rounded-3xl p-8 mb-8">
            <p className="text-xs uppercase tracking-[0.3em] text-lime-300/80">
              Public Workout
            </p>
            <h1 className="display-font text-4xl mt-3">{workout.name}</h1>
            {workout.description && (
              <p className="text-gray-400 mt-3">{workout.description}</p>
            )}

            <div className="flex flex-wrap gap-3 mt-6">
              <button
                onClick={handleStart}
                className="lime-button px-6 py-3 rounded-full text-sm"
              >
                Start Workout
              </button>
              {session ? (
                <button
                  onClick={handleClone}
                  disabled={cloning}
                  className="ghost-button px-6 py-3 rounded-full text-sm disabled:opacity-50"
                >
                  {cloning ? 'Cloning...' : 'Clone to My Workouts'}
                </button>
              ) : (
                <Link
                  href="/login"
                  className="ghost-button px-6 py-3 rounded-full text-sm"
                >
                  Sign in to Clone
                </Link>
              )}
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-4">Sets</h2>
          <div className="space-y-4">
            {workout.sets.map((set, setIndex) => (
              <div key={set.id} className="track-card rounded-2xl p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">
                      Set {setIndex + 1}
                    </h3>
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
                      {index + 1}. {exercise.name} · {exercise.workDuration}s
                      work
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </AppShell>
  )
}
