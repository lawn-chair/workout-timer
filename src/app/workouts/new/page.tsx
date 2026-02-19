'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutStore, WorkoutFormData } from '@/lib/workout/store'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'

interface ExerciseField {
  name: string
  workDuration: number
}

interface SetField {
  repeatCount: number
  restBetweenExercises: number
  restBetweenSets: number
  exercises: ExerciseField[]
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [sets, setSets] = useState<SetField[]>([
    {
      repeatCount: 1,
      restBetweenExercises: 0,
      restBetweenSets: 0,
      exercises: [
        {
          name: '',
          workDuration: 30,
        },
      ],
    },
  ])
  const [saving, setSaving] = useState(false)

  const { createWorkout } = useWorkoutStore()

  const addSet = () => {
    setSets([
      ...sets,
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [
          {
            name: '',
            workDuration: 30,
          },
        ],
      },
    ])
  }

  const removeSet = (index: number) => {
    setSets(sets.filter((_, i) => i !== index))
  }

  const updateSet = (
    index: number,
    field: keyof Omit<SetField, 'exercises'>,
    value: number
  ) => {
    const updated = [...sets]
    updated[index] = { ...updated[index], [field]: value }
    setSets(updated)
  }

  const addExercise = (setIndex: number) => {
    const updated = [...sets]
    updated[setIndex] = {
      ...updated[setIndex],
      exercises: [
        ...updated[setIndex].exercises,
        { name: '', workDuration: 30 },
      ],
    }
    setSets(updated)
  }

  const removeExercise = (setIndex: number, exerciseIndex: number) => {
    const updated = [...sets]
    updated[setIndex] = {
      ...updated[setIndex],
      exercises: updated[setIndex].exercises.filter(
        (_, i) => i !== exerciseIndex
      ),
    }
    setSets(updated)
  }

  const updateExercise = (
    setIndex: number,
    exerciseIndex: number,
    field: keyof ExerciseField,
    value: string | number
  ) => {
    const updated = [...sets]
    const exercises = [...updated[setIndex].exercises]
    exercises[exerciseIndex] = { ...exercises[exerciseIndex], [field]: value }
    updated[setIndex] = { ...updated[setIndex], exercises }
    setSets(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)

    const data: WorkoutFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      tags: tags.trim() || undefined,
      isPublic,
      sets: sets
        .map((set) => ({
          repeatCount: Math.max(set.repeatCount, 1),
          restBetweenExercises: Math.max(set.restBetweenExercises, 0),
          restBetweenSets: Math.max(set.restBetweenSets, 0),
          exercises: set.exercises
            .filter((ex) => ex.name.trim())
            .map((ex) => ({
              name: ex.name.trim(),
              workDuration: Math.max(ex.workDuration, 1),
            })),
        }))
        .filter((set) => set.exercises.length > 0),
    }

    if (data.sets.length === 0) {
      setSaving(false)
      return
    }

    await createWorkout(data)
    router.push('/')
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="border-b border-white/5 bg-black/30">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-lime-400/20 text-lime-300 flex items-center justify-center">
              <IconMark className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-lime-300/80">
                Build Workout
              </p>
              <h1 className="display-font text-3xl">New Session</h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-5 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                Workout Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Morning HIIT"
                className="w-full input-field rounded-xl px-4 py-3 text-white placeholder-gray-500"
                required
                data-testid="workout-name-input"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this workout"
                rows={2}
                className="w-full input-field rounded-xl px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-gray-400 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., HIIT, Strength, Cardio"
                className="w-full input-field rounded-xl px-4 py-3 text-white placeholder-gray-500"
              />
            </div>

            <div className="glass-panel rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Public workout</p>
                <p className="text-xs text-gray-400">
                  Allow others to view and clone this session.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((prev) => !prev)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  isPublic ? 'bg-lime-400' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                    isPublic ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
                <div>
                  <h2 className="text-lg font-semibold">Sets</h2>
                  <p className="text-xs text-gray-400">
                    Organize the workout into repeatable blocks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addSet}
                  className="lime-button px-4 py-2 rounded-full text-xs"
                  data-testid="add-set-button"
                >
                  + Add Set
                </button>
              </div>

              {sets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No sets yet. Click &quot;Add Set&quot; to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {sets.map((set, setIndex) => (
                    <div key={setIndex} className="track-card rounded-2xl p-5">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          Set {setIndex + 1}
                        </span>
                        {sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSet(setIndex)}
                            className="text-red-300 hover:text-red-200 text-xs"
                            data-testid={`remove-set-button-${setIndex}`}
                          >
                            Remove Set
                          </button>
                        )}
                      </div>

                      <div className="grid gap-3 mb-4 md:grid-cols-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Repeat Count
                          </label>
                          <input
                            type="number"
                            value={set.repeatCount}
                            onChange={(e) =>
                              updateSet(
                                setIndex,
                                'repeatCount',
                                parseInt(e.target.value) || 1
                              )
                            }
                            min={1}
                            className="w-full input-field rounded-lg px-3 py-2"
                            data-testid={`set-repeat-input-${setIndex}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Rest Between Exercises
                          </label>
                          <input
                            type="number"
                            value={set.restBetweenExercises}
                            onChange={(e) =>
                              updateSet(
                                setIndex,
                                'restBetweenExercises',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full input-field rounded-lg px-3 py-2"
                            data-testid={`rest-between-exercises-input-${setIndex}`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Rest Between Sets
                          </label>
                          <input
                            type="number"
                            value={set.restBetweenSets}
                            onChange={(e) =>
                              updateSet(
                                setIndex,
                                'restBetweenSets',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full input-field rounded-lg px-3 py-2"
                            data-testid={`rest-between-sets-input-${setIndex}`}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-semibold">Exercises</h3>
                        <button
                          type="button"
                          onClick={() => addExercise(setIndex)}
                          className="ghost-button px-3 py-1.5 rounded-full text-xs"
                          data-testid={`add-exercise-button-${setIndex}`}
                        >
                          + Add Exercise
                        </button>
                      </div>

                      {set.exercises.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                          No exercises yet. Click &quot;Add Exercise&quot; to
                          get started.
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {set.exercises.map((exercise, exerciseIndex) => (
                            <div
                              key={exerciseIndex}
                              className="bg-black/40 rounded-xl p-4 border border-white/5"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                                  Exercise {exerciseIndex + 1}
                                </span>
                                {set.exercises.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeExercise(setIndex, exerciseIndex)
                                    }
                                    className="text-red-300 hover:text-red-200 text-xs"
                                    data-testid={`remove-exercise-button-${setIndex}-${exerciseIndex}`}
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">
                                    Name
                                  </label>
                                  <input
                                    type="text"
                                    value={exercise.name}
                                    onChange={(e) =>
                                      updateExercise(
                                        setIndex,
                                        exerciseIndex,
                                        'name',
                                        e.target.value
                                      )
                                    }
                                    placeholder="e.g., Jumping Jacks"
                                    className="w-full input-field rounded-lg px-3 py-2 placeholder-gray-600"
                                    required
                                    data-testid={`exercise-name-input-${setIndex}-${exerciseIndex}`}
                                  />
                                </div>

                                <div>
                                  <label className="block text-xs text-gray-400 mb-1">
                                    Work (seconds)
                                  </label>
                                  <input
                                    type="number"
                                    value={exercise.workDuration}
                                    onChange={(e) =>
                                      updateExercise(
                                        setIndex,
                                        exerciseIndex,
                                        'workDuration',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    min={1}
                                    className="w-full input-field rounded-lg px-3 py-2"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 pt-4 md:flex-row">
              <button
                type="button"
                onClick={() => router.push('/')}
                className="flex-1 ghost-button py-3 rounded-full font-medium"
                data-testid="cancel-button"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="flex-1 lime-button disabled:bg-gray-600 py-3 rounded-full font-medium"
                data-testid="create-workout-button"
              >
                {saving ? 'Saving...' : 'Create Workout'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </AppShell>
  )
}
