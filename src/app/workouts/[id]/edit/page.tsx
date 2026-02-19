'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWorkoutStore, WorkoutFormData } from '@/lib/workout/store'
import { fetchWorkout } from '@/lib/workout/api'

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

export default function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = React.use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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

  const { updateWorkout } = useWorkoutStore()

  useEffect(() => {
    fetchWorkout(id)
      .then((workout) => {
        setName(workout.name)
        setDescription(workout.description || '')
        setTags(workout.tags || '')
        setIsPublic(workout.isPublic || false)
        setSets(
          workout.sets.map((set) => ({
            repeatCount: set.repeatCount,
            restBetweenExercises: set.restBetweenExercises,
            restBetweenSets: set.restBetweenSets,
            exercises: set.exercises.map((ex) => ({
              name: ex.name,
              workDuration: ex.workDuration,
            })),
          }))
        )
        setLoading(false)
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

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

    await updateWorkout(id, data)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Workout not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">Edit Workout</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Workout Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Morning HIIT"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              data-testid="workout-name-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this workout"
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., HIIT, Strength, Cardio"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded bg-gray-800 border-gray-700"
            />
            <label
              htmlFor="isPublic"
              className="text-sm font-medium text-gray-300"
            >
              Make this workout public (others can view and clone)
            </label>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Sets</h2>
              <button
                type="button"
                onClick={addSet}
                className="text-green-500 hover:text-green-400 text-sm font-medium"
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
                  <div
                    key={setIndex}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-400">
                        Set {setIndex + 1}
                      </span>
                      {sets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSet(setIndex)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          data-testid={`remove-set-button-${setIndex}`}
                        >
                          Remove Set
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-4">
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
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
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
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
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
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          data-testid={`rest-between-sets-input-${setIndex}`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold">Exercises</h3>
                      <button
                        type="button"
                        onClick={() => addExercise(setIndex)}
                        className="text-green-500 hover:text-green-400 text-xs font-medium"
                        data-testid={`add-exercise-button-${setIndex}`}
                      >
                        + Add Exercise
                      </button>
                    </div>

                    {set.exercises.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">
                        No exercises yet. Click &quot;Add Exercise&quot; to get
                        started.
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {set.exercises.map((exercise, exerciseIndex) => (
                          <div
                            key={exerciseIndex}
                            className="bg-gray-900 rounded-lg p-3 border border-gray-700"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <span className="text-sm font-medium text-gray-400">
                                Exercise {exerciseIndex + 1}
                              </span>
                              {set.exercises.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeExercise(setIndex, exerciseIndex)
                                  }
                                  className="text-red-400 hover:text-red-300 text-xs"
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
                                  className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
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
                                  className="w-full bg-gray-950 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
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

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded-lg font-medium"
              data-testid="cancel-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 py-3 rounded-lg font-medium"
              data-testid="update-workout-button"
            >
              {saving ? 'Saving...' : 'Update Workout'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
