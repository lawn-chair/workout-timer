import { describe, it, expect, beforeEach } from 'vitest'
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  getWorkout,
  WorkoutFormData,
} from './store'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
})

describe('workout store', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getWorkouts', () => {
    it('should return empty array when no workouts exist', () => {
      expect(getWorkouts()).toEqual([])
    })

    it('should return stored workouts', () => {
      localStorageMock.setItem(
        'workout-timer-workouts',
        JSON.stringify([
          {
            id: '1',
            name: 'Test',
            exercises: [],
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ])
      )
      const workouts = getWorkouts()
      expect(workouts).toHaveLength(1)
      expect(workouts[0].name).toBe('Test')
    })

    it('should return empty array on invalid JSON', () => {
      localStorageMock.setItem('workout-timer-workouts', 'invalid')
      expect(getWorkouts()).toEqual([])
    })
  })

  describe('createWorkout', () => {
    it('should create a new workout', () => {
      const data: WorkoutFormData = {
        name: 'Morning HIIT',
        description: 'Quick workout',
        exercises: [
          {
            name: 'Jumping Jacks',
            workDuration: 30,
            restDuration: 10,
            sets: 3,
            restBetweenSets: 30,
          },
        ],
      }

      const workout = createWorkout(data)

      expect(workout.name).toBe('Morning HIIT')
      expect(workout.description).toBe('Quick workout')
      expect(workout.exercises).toHaveLength(1)
      expect(workout.exercises[0].name).toBe('Jumping Jacks')
      expect(workout.exercises[0].workDuration).toBe(30)
      expect(workout.id).toBeDefined()
    })

    it('should handle workout without description', () => {
      const data: WorkoutFormData = {
        name: 'Test',
        exercises: [
          {
            name: 'Push-ups',
            workDuration: 30,
            restDuration: 10,
            sets: 1,
            restBetweenSets: 0,
          },
        ],
      }

      const workout = createWorkout(data)

      expect(workout.description).toBeUndefined()
    })

    it('should add workout to storage', () => {
      const data: WorkoutFormData = {
        name: 'Test',
        exercises: [],
      }

      createWorkout(data)

      const workouts = getWorkouts()
      expect(workouts).toHaveLength(1)
    })
  })

  describe('getWorkout', () => {
    it('should return workout by id', () => {
      const data: WorkoutFormData = {
        name: 'Test',
        exercises: [],
      }

      const created = createWorkout(data)
      const found = getWorkout(created.id)

      expect(found).toBeDefined()
      expect(found?.name).toBe('Test')
    })

    it('should return undefined for non-existent workout', () => {
      expect(getWorkout('non-existent')).toBeUndefined()
    })
  })

  describe('updateWorkout', () => {
    it('should update existing workout', () => {
      const created = createWorkout({ name: 'Original', exercises: [] })

      const updated = updateWorkout(created.id, {
        name: 'Updated',
        exercises: [
          {
            name: 'New',
            workDuration: 30,
            restDuration: 10,
            sets: 1,
            restBetweenSets: 0,
          },
        ],
      })

      expect(updated).toBeDefined()
      expect(updated?.name).toBe('Updated')
      expect(updated?.exercises[0].name).toBe('New')
    })

    it('should return null for non-existent workout', () => {
      const result = updateWorkout('non-existent', {
        name: 'Test',
        exercises: [],
      })
      expect(result).toBeNull()
    })
  })

  describe('deleteWorkout', () => {
    it('should delete workout', () => {
      const created = createWorkout({ name: 'Test', exercises: [] })

      const result = deleteWorkout(created.id)

      expect(result).toBe(true)
      expect(getWorkouts()).toHaveLength(0)
    })

    it('should return false for non-existent workout', () => {
      const result = deleteWorkout('non-existent')
      expect(result).toBe(false)
    })
  })
})
