import { describe, it, expect } from 'vitest'
import { getTotalWorkoutTime } from './types'
import { Workout } from './types'

type ExerciseInput = { name?: string; workDuration?: number }
type SetInput = {
  repeatCount?: number
  restBetweenExercises?: number
  restBetweenSets?: number
  exercises?: ExerciseInput[]
}

const createWorkout = (sets: SetInput[]): Workout => ({
  id: '1',
  name: 'Test',
  sets: sets.map((set, setIndex) => ({
    id: String(setIndex + 1),
    order: setIndex,
    repeatCount: set.repeatCount ?? 1,
    restBetweenExercises: set.restBetweenExercises ?? 0,
    restBetweenSets: set.restBetweenSets ?? 0,
    exercises: (set.exercises ?? [{ workDuration: 30 }]).map((ex, exIndex) => ({
      id: `${setIndex + 1}-${exIndex + 1}`,
      name: ex.name || 'Exercise',
      workDuration: ex.workDuration ?? 30,
      order: exIndex,
    })),
  })),
})

describe('getTotalWorkoutTime', () => {
  it('should calculate time for single exercise single set', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ workDuration: 30 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(30)
  })

  it('should calculate time for repeats and rest between exercises', () => {
    const workout = createWorkout([
      {
        repeatCount: 2,
        restBetweenExercises: 10,
        restBetweenSets: 0,
        exercises: [{ workDuration: 20 }, { workDuration: 30 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(120)
  })

  it('should include rest between sets', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 15,
        exercises: [{ workDuration: 30 }],
      },
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ workDuration: 45 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(90)
  })

  it('should calculate time for multiple sets and exercises', () => {
    const workout = createWorkout([
      {
        repeatCount: 3,
        restBetweenExercises: 5,
        restBetweenSets: 10,
        exercises: [{ workDuration: 10 }, { workDuration: 20 }],
      },
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ workDuration: 40 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(155)
  })

  it('should return 0 for empty workout', () => {
    const workout = createWorkout([])
    expect(getTotalWorkoutTime(workout)).toBe(0)
  })

  it('should handle zero rest between exercises', () => {
    const workout = createWorkout([
      {
        repeatCount: 2,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ workDuration: 30 }, { workDuration: 30 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(120)
  })

  it('should ignore rest between sets for final set', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 30,
        exercises: [{ workDuration: 30 }],
      },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(30)
  })
})
