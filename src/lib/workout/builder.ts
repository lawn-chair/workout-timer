import { arrayMove } from '@/lib/utils/arrayMove'
import type { Workout } from '@/lib/workout/types'

export interface ExerciseDraft {
  clientId: string
  name: string
  workDuration: number
}

export interface SetDraft {
  clientId: string
  repeatCount: number
  restBetweenExercises: number
  restBetweenRepeats: number
  restBetweenSets: number
  exercises: ExerciseDraft[]
}

let clientIdCounter = 0

const createClientId = (prefix: 'set' | 'exercise') =>
  `${prefix}-${clientIdCounter++}`

export const createExercise = (
  overrides: Partial<ExerciseDraft> = {}
): ExerciseDraft => ({
  clientId: createClientId('exercise'),
  name: '',
  workDuration: 30,
  ...overrides,
})

export const createSet = (overrides: Partial<SetDraft> = {}): SetDraft => ({
  clientId: createClientId('set'),
  repeatCount: 1,
  restBetweenExercises: 0,
  restBetweenRepeats: 0,
  restBetweenSets: 0,
  exercises: [createExercise()],
  ...overrides,
})

export const hydrateWorkoutSets = (sets: Workout['sets']): SetDraft[] =>
  sets.map((set) => ({
    clientId: createClientId('set'),
    repeatCount: set.repeatCount,
    restBetweenExercises: set.restBetweenExercises,
    restBetweenRepeats: set.restBetweenRepeats,
    restBetweenSets: set.restBetweenSets,
    exercises: set.exercises.map((exercise) =>
      createExercise({
        name: exercise.name,
        workDuration: exercise.workDuration,
      })
    ),
  }))

export const addSet = (sets: SetDraft[]): SetDraft[] => [...sets, createSet()]

export const removeSet = (sets: SetDraft[], index: number): SetDraft[] =>
  sets.filter((_, i) => i !== index)

export const updateSetField = (
  sets: SetDraft[],
  index: number,
  field:
    | 'repeatCount'
    | 'restBetweenExercises'
    | 'restBetweenRepeats'
    | 'restBetweenSets',
  value: number
): SetDraft[] =>
  sets.map((set, i) => (i === index ? { ...set, [field]: value } : set))

export const addExercise = (sets: SetDraft[], setIndex: number): SetDraft[] =>
  sets.map((set, i) =>
    i === setIndex
      ? {
          ...set,
          exercises: [...set.exercises, createExercise()],
        }
      : set
  )

export const removeExercise = (
  sets: SetDraft[],
  setIndex: number,
  exerciseIndex: number
): SetDraft[] =>
  sets.map((set, i) =>
    i === setIndex
      ? {
          ...set,
          exercises: set.exercises.filter((_, idx) => idx !== exerciseIndex),
        }
      : set
  )

export const updateExerciseField = (
  sets: SetDraft[],
  setIndex: number,
  exerciseIndex: number,
  field: 'name' | 'workDuration',
  value: string | number
): SetDraft[] =>
  sets.map((set, i) => {
    if (i !== setIndex) return set
    const exercises = set.exercises.map((exercise, idx) =>
      idx === exerciseIndex ? { ...exercise, [field]: value } : exercise
    )
    return { ...set, exercises }
  })

export const replaceExercises = (
  sets: SetDraft[],
  setIndex: number,
  exercises: ExerciseDraft[]
): SetDraft[] =>
  sets.map((set, i) => (i === setIndex ? { ...set, exercises } : set))

export const reorderSetsById = (
  sets: SetDraft[],
  activeId: string,
  overId: string
): SetDraft[] => {
  if (activeId === overId) return sets
  const fromIndex = sets.findIndex((set) => set.clientId === activeId)
  const toIndex = sets.findIndex((set) => set.clientId === overId)
  if (fromIndex === -1 || toIndex === -1) return sets
  return arrayMove(sets, fromIndex, toIndex)
}

export const reorderExercisesById = (
  sets: SetDraft[],
  setId: string,
  activeId: string,
  overId: string
): SetDraft[] => {
  if (activeId === overId) return sets
  const setIndex = sets.findIndex((set) => set.clientId === setId)
  if (setIndex === -1) return sets
  const exercises = sets[setIndex].exercises
  const fromIndex = exercises.findIndex(
    (exercise) => exercise.clientId === activeId
  )
  const toIndex = exercises.findIndex(
    (exercise) => exercise.clientId === overId
  )
  if (fromIndex === -1 || toIndex === -1) return sets
  const nextExercises = arrayMove(exercises, fromIndex, toIndex)
  return replaceExercises(sets, setIndex, nextExercises)
}
