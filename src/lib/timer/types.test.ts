import { describe, it, expect } from 'vitest'
import { getTotalWorkoutTime } from './types'
import { Workout } from './types'

const createWorkout = (
  exercises: Partial<Workout['exercises'][0]>[]
): Workout => ({
  id: '1',
  name: 'Test',
  exercises: exercises.map((e, i) => ({
    id: String(i + 1),
    name: e.name || 'Exercise',
    workDuration: e.workDuration ?? 30,
    restDuration: e.restDuration ?? 10,
    sets: e.sets ?? 1,
    restBetweenSets: e.restBetweenSets ?? 0,
  })),
})

describe('getTotalWorkoutTime', () => {
  it('should calculate time for single exercise single set', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 10, sets: 1 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(40)
  })

  it('should calculate time for multiple sets', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 10, sets: 3 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(120)
  })

  it('should include rest between sets', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 10, sets: 3, restBetweenSets: 30 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(180)
  })

  it('should calculate time for multiple exercises', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 10, sets: 2, restBetweenSets: 30 },
      { workDuration: 45, restDuration: 15, sets: 3, restBetweenSets: 0 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(290)
  })

  it('should return 0 for empty workout', () => {
    const workout = createWorkout([])
    expect(getTotalWorkoutTime(workout)).toBe(0)
  })

  it('should handle zero rest durations', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 0, sets: 2 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(60)
  })

  it('should handle single set with rest between sets (should be 0)', () => {
    const workout = createWorkout([
      { workDuration: 30, restDuration: 10, sets: 1, restBetweenSets: 30 },
    ])
    expect(getTotalWorkoutTime(workout)).toBe(40)
  })
})
