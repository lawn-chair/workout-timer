import { describe, expect, it } from 'vitest'
import {
  addExercise,
  addSet,
  createSet,
  hydrateWorkoutSets,
  removeExercise,
  removeSet,
  reorderExercisesById,
  reorderSetsById,
  updateExerciseField,
  updateSetField,
} from './builder'

describe('workout builder helpers', () => {
  it('keeps client ids stable when updating sets', () => {
    const set = createSet()
    const result = updateSetField([set], 0, 'repeatCount', 3)
    expect(result[0].clientId).toBe(set.clientId)
    expect(result[0].repeatCount).toBe(3)
  })

  it('keeps client ids stable when updating exercises', () => {
    const set = createSet()
    const exerciseId = set.exercises[0].clientId
    const result = updateExerciseField([set], 0, 0, 'name', 'Burpees')
    expect(result[0].exercises[0].clientId).toBe(exerciseId)
    expect(result[0].exercises[0].name).toBe('Burpees')
  })

  it('preserves client ids when adding and removing items', () => {
    const initial = [createSet(), createSet()]
    const withSet = addSet(initial)
    const removed = removeSet(withSet, 1)
    expect(removed[0].clientId).toBe(initial[0].clientId)

    const withExercise = addExercise(removed, 0)
    const removedExercise = removeExercise(withExercise, 0, 0)
    expect(removedExercise[0].exercises[0].clientId).toBe(
      withExercise[0].exercises[1].clientId
    )
  })

  it('reorders sets by client id', () => {
    const a = createSet()
    const b = createSet()
    const result = reorderSetsById([a, b], b.clientId, a.clientId)
    expect(result[0].clientId).toBe(b.clientId)
  })

  it('reorders exercises by client id within a set', () => {
    const set = createSet()
    const second = createSet().exercises[0]
    const sets = [{ ...set, exercises: [set.exercises[0], second] }]
    const result = reorderExercisesById(
      sets,
      sets[0].clientId,
      second.clientId,
      set.exercises[0].clientId
    )
    expect(result[0].exercises[0].clientId).toBe(second.clientId)
  })

  it('hydrates workout sets with client ids', () => {
    const result = hydrateWorkoutSets([
      {
        id: 'set-1',
        order: 0,
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenRepeats: 0,
        restBetweenSets: 0,
        exercises: [
          {
            id: 'ex-1',
            order: 0,
            name: 'Jumping Jacks',
            workDuration: 30,
          },
        ],
      },
    ])

    expect(result[0].clientId).toMatch(/^set-/)
    expect(result[0].exercises[0].clientId).toMatch(/^exercise-/)
    expect(result[0].exercises[0].name).toBe('Jumping Jacks')
  })
})
