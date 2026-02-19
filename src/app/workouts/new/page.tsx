'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkout, WorkoutFormData } from '@/lib/workout/store'

interface ExerciseField {
  name: string
  workDuration: number
  restDuration: number
  sets: number
  restBetweenSets: number
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<ExerciseField[]>([
    {
      name: '',
      workDuration: 30,
      restDuration: 10,
      sets: 1,
      restBetweenSets: 0,
    },
  ])
  const [saving, setSaving] = useState(false)

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        name: '',
        workDuration: 30,
        restDuration: 10,
        sets: 1,
        restBetweenSets: 0,
      },
    ])
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const updateExercise = (
    index: number,
    field: keyof ExerciseField,
    value: string | number
  ) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setSaving(true)

    const data: WorkoutFormData = {
      name: name.trim(),
      description: description.trim() || undefined,
      exercises: exercises
        .filter((ex) => ex.name.trim())
        .map((ex) => ({
          name: ex.name.trim(),
          workDuration: ex.workDuration,
          restDuration: ex.restDuration,
          sets: ex.sets,
          restBetweenSets: ex.restBetweenSets,
        })),
    }

    createWorkout(data)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold">New Workout</h1>
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
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Exercises</h2>
              <button
                type="button"
                onClick={addExercise}
                className="text-green-500 hover:text-green-400 text-sm font-medium"
              >
                + Add Exercise
              </button>
            </div>

            {exercises.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                No exercises yet. Click &quot;Add Exercise&quot; to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-medium text-gray-400">
                        Exercise {index + 1}
                      </span>
                      {exercises.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
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
                            updateExercise(index, 'name', e.target.value)
                          }
                          placeholder="e.g., Jumping Jacks"
                          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Work (seconds)
                          </label>
                          <input
                            type="number"
                            value={exercise.workDuration}
                            onChange={(e) =>
                              updateExercise(
                                index,
                                'workDuration',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={1}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Rest (seconds)
                          </label>
                          <input
                            type="number"
                            value={exercise.restDuration}
                            onChange={(e) =>
                              updateExercise(
                                index,
                                'restDuration',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Sets
                          </label>
                          <input
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              updateExercise(
                                index,
                                'sets',
                                parseInt(e.target.value) || 1
                              )
                            }
                            min={1}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">
                            Rest Between Sets
                          </label>
                          <input
                            type="number"
                            value={exercise.restBetweenSets}
                            onChange={(e) =>
                              updateExercise(
                                index,
                                'restBetweenSets',
                                parseInt(e.target.value) || 0
                              )
                            }
                            min={0}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    </div>
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
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 py-3 rounded-lg font-medium"
            >
              {saving ? 'Saving...' : 'Create Workout'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
