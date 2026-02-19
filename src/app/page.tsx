'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useWorkoutStore, Workout } from '@/lib/workout/store'
import { useTimerStore } from '@/lib/timer/store'
import { fetchPublicWorkouts } from '@/lib/workout/api'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'
import StatePanel from '@/components/ui/StatePanel'

export default function Home() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const loadWorkout = useTimerStore((s) => s.loadWorkout)

  const { workouts, isLoading, fetchWorkouts, deleteWorkout } =
    useWorkoutStore()
  const [publicWorkouts, setPublicWorkouts] = useState<Workout[]>([])
  const [showPublic, setShowPublic] = useState(false)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const allTags = useMemo(
    () =>
      Array.from(
        new Set(
          workouts.flatMap((w) =>
            (w.tags || '')
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          )
        )
      ),
    [workouts]
  )

  const filteredWorkouts = useMemo(
    () =>
      selectedTag
        ? workouts.filter((w) =>
            (w.tags || '')
              .split(',')
              .map((t) => t.trim())
              .includes(selectedTag)
          )
        : workouts,
    [selectedTag, workouts]
  )

  const calculateStats = (workout: Workout) => {
    const exerciseCount = workout.sets.reduce(
      (sum, set) => sum + set.exercises.length,
      0
    )
    const totalSeconds = workout.sets.reduce((sum, set, setIndex) => {
      const exerciseTotal = set.exercises.reduce(
        (exerciseSum, exercise) => exerciseSum + exercise.workDuration,
        0
      )
      const restBetweenExercises =
        Math.max(set.exercises.length - 1, 0) * set.restBetweenExercises
      const perSetTotal = exerciseTotal + restBetweenExercises
      const repeatTotal = perSetTotal * Math.max(set.repeatCount, 1)
      const setRestTotal =
        setIndex < workout.sets.length - 1 ? set.restBetweenSets : 0
      return sum + repeatTotal + setRestTotal
    }, 0)

    return {
      exerciseCount,
      setCount: workout.sets.length,
      totalMinutes: Math.max(Math.round(totalSeconds / 60), 1),
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchWorkouts()
    }
  }, [status, router, fetchWorkouts])

  useEffect(() => {
    if (showPublic) {
      fetchPublicWorkouts().then(setPublicWorkouts).catch(console.error)
    }
  }, [showPublic])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Delete this workout?')) return
    await deleteWorkout(id)
  }

  const handleStart = (workout: Workout) => {
    loadWorkout({
      id: workout.id,
      name: workout.name,
      description: workout.description,
      sets: workout.sets,
    })
    router.push('/timer')
  }

  if (status === 'loading' || isLoading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-5">
          <StatePanel
            eyebrow="Loading"
            title="Preparing your workouts"
            description="Syncing your latest training blocks."
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="border-b border-white/5 bg-black/30">
          <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-lime-400/20 text-lime-300 flex items-center justify-center">
                <IconMark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-lime-300/80">
                  Workout Timer
                </p>
                <h1 className="display-font text-3xl">Performance Console</h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {session?.user && (
                <span className="text-sm text-gray-400">
                  {session.user.name}
                </span>
              )}
              <button
                onClick={() => setShowPublic(!showPublic)}
                className="ghost-button px-4 py-2 rounded-full text-sm"
              >
                {showPublic ? 'My Workouts' : 'Browse Public'}
              </button>
              <Link
                href="/workouts/new"
                className="lime-button px-5 py-2 rounded-full text-sm"
                data-testid="new-workout-button"
              >
                + New Workout
              </Link>
              <Link
                href="/settings"
                className="ghost-button px-4 py-2 rounded-full text-sm"
              >
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="ghost-button px-4 py-2 rounded-full text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-5 py-8">
          <div className="grid lg:grid-cols-[1.4fr_0.6fr] gap-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold">
                    {showPublic ? 'Public Workouts' : 'Your Workouts'}
                  </h2>
                  <p className="text-sm text-gray-400">
                    {showPublic
                      ? 'Find community workouts to clone and start.'
                      : 'Build, edit, and launch your next session.'}
                  </p>
                </div>
              </div>

              {showPublic ? (
                publicWorkouts.length === 0 ? (
                  <StatePanel
                    eyebrow="Public Library"
                    title="No public workouts yet"
                    description="Check back later or publish one of yours."
                  />
                ) : (
                  <div className="space-y-4">
                    {publicWorkouts.map((workout) => {
                      const stats = calculateStats(workout)
                      return (
                        <div
                          key={workout.id}
                          className="track-card rounded-2xl p-5"
                        >
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <Link href={`/w/${workout.slug || workout.id}`}>
                                <h3 className="text-2xl font-semibold hover:text-lime-300 transition">
                                  {workout.name}
                                </h3>
                              </Link>
                              {workout.description && (
                                <p className="text-sm text-gray-400 mt-1">
                                  {workout.description}
                                </p>
                              )}
                              <div className="flex gap-4 text-xs text-gray-400 mt-3">
                                <span>{stats.exerciseCount} exercises</span>
                                <span>{stats.setCount} sets</span>
                                <span>{stats.totalMinutes} min</span>
                              </div>
                            </div>
                            <Link
                              href={`/w/${workout.slug || workout.id}`}
                              className="ghost-button px-5 py-2 rounded-full text-sm"
                            >
                              View Details
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              ) : workouts.length === 0 ? (
                <StatePanel
                  eyebrow="Your Library"
                  title="No workouts yet"
                  description="Start your first training block and add intervals."
                  action={
                    <Link
                      href="/workouts/new"
                      className="lime-button px-6 py-3 rounded-full text-sm"
                    >
                      Create your first workout
                    </Link>
                  }
                />
              ) : (
                <>
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => setSelectedTag(null)}
                        className={`px-4 py-1.5 rounded-full text-sm ${
                          selectedTag === null ? 'lime-button' : 'ghost-button'
                        }`}
                      >
                        All
                      </button>
                      {allTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(tag)}
                          className={`px-4 py-1.5 rounded-full text-sm ${
                            selectedTag === tag ? 'lime-button' : 'ghost-button'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="space-y-4">
                    {filteredWorkouts.map((workout) => {
                      const stats = calculateStats(workout)
                      return (
                        <div
                          key={workout.id}
                          className="track-card rounded-2xl p-6"
                          data-testid={`workout-card-${workout.id}`}
                        >
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                              <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-semibold">
                                  {workout.name}
                                </h2>
                                {workout.isPublic && (
                                  <span className="chip text-xs px-3 py-1 rounded-full">
                                    Public
                                  </span>
                                )}
                              </div>
                              {workout.description && (
                                <p className="text-sm text-gray-400 mt-2">
                                  {workout.description}
                                </p>
                              )}
                              {workout.tags && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {workout.tags
                                    .split(',')
                                    .map((t) => t.trim())
                                    .filter(Boolean)
                                    .map((tag) => (
                                      <span
                                        key={tag}
                                        className="chip text-xs px-3 py-1 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                </div>
                              )}
                              <div className="grid grid-cols-3 gap-4 text-xs text-gray-400 mt-4">
                                <div>
                                  <p className="text-gray-500">Exercises</p>
                                  <p
                                    className="text-white text-sm font-semibold"
                                    data-testid={`stat-exercises-${workout.id}`}
                                  >
                                    {stats.exerciseCount}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Sets</p>
                                  <p
                                    className="text-white text-sm font-semibold"
                                    data-testid={`stat-sets-${workout.id}`}
                                  >
                                    {stats.setCount}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Est. Time</p>
                                  <p
                                    className="text-white text-sm font-semibold"
                                    data-testid={`stat-time-${workout.id}`}
                                  >
                                    {stats.totalMinutes} min
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => handleStart(workout)}
                                className="lime-button px-5 py-2 rounded-full text-sm"
                                data-testid={`start-workout-${workout.id}`}
                              >
                                Start
                              </button>
                              <Link
                                href={`/workouts/${workout.id}/edit`}
                                className="ghost-button px-5 py-2 rounded-full text-sm"
                                data-testid={`edit-workout-${workout.id}`}
                              >
                                Edit
                              </Link>
                              <button
                                onClick={(e) => handleDelete(workout.id, e)}
                                className="px-5 py-2 rounded-full text-sm border border-red-500/40 text-red-200 hover:bg-red-500/10"
                                data-testid={`delete-workout-${workout.id}`}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </section>

            <aside className="space-y-4">
              <div className="glass-panel rounded-2xl p-6">
                <p className="text-[0.65rem] uppercase tracking-[0.35em] text-lime-300">
                  Today
                </p>
                <h3 className="text-2xl font-semibold mt-4">
                  Train with intent.
                </h3>
                <p className="text-sm text-gray-400 mt-3">
                  Build your next interval, set the pace, and hit start when
                  you&apos;re ready.
                </p>
                <div className="mt-6">
                  <Link
                    href="/workouts/new"
                    className="lime-button w-full py-3 rounded-xl text-sm text-center"
                  >
                    Create Workout
                  </Link>
                </div>
              </div>
              <div className="glass-panel rounded-2xl p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
                  Focus
                </p>
                <h4 className="text-lg font-semibold mt-2">Next session</h4>
                <p className="text-sm text-gray-400">
                  Pick a workout and get moving. Timer cues keep you locked in.
                </p>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
