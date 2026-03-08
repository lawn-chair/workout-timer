'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { WorkoutFormData } from '@/lib/workout/types'
import { useCreateWorkout } from '@/lib/workout/queries'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'
import { createSet, SetDraft } from '@/lib/workout/builder'
import WorkoutBuilderSets from '@/components/workout/WorkoutBuilderSets'

export default function NewWorkoutPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [sets, setSets] = useState<SetDraft[]>([createSet()])
  const [saving, setSaving] = useState(false)

  const createMutation = useCreateWorkout()

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

    await createMutation.mutateAsync(data)
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

            <WorkoutBuilderSets sets={sets} onSetsChange={setSets} />

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
