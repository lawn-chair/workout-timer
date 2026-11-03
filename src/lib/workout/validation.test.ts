import { describe, it, expect } from 'vitest'
import { validateWorkoutInput } from './validation'

function validExercise(overrides: Record<string, unknown> = {}) {
  return { name: 'Push-ups', workDuration: 30, ...overrides }
}

function validSet(overrides: Record<string, unknown> = {}) {
  return {
    repeatCount: 3,
    restBetweenExercises: 10,
    restBetweenRepeats: 15,
    restBetweenSets: 60,
    exercises: [validExercise()],
    ...overrides,
  }
}

function validWorkout(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Morning HIIT',
    description: 'Quick circuit',
    isPublic: false,
    tags: ['hiit', 'cardio'],
    sets: [validSet()],
    ...overrides,
  }
}

function expectInvalid(input: unknown) {
  const result = validateWorkoutInput(input)
  if (result.success) {
    throw new Error(`Expected validation to fail for ${JSON.stringify(input)}`)
  }
  return result.errors
}

describe('validateWorkoutInput', () => {
  describe('valid input', () => {
    it('accepts a complete workout and returns the parsed data', () => {
      const input = validWorkout()
      const result = validateWorkoutInput(input)

      expect(result).toEqual({ success: true, data: input })
    })

    it('accepts a workout without optional fields', () => {
      const result = validateWorkoutInput({
        name: 'Minimal',
        sets: [validSet()],
      })

      expect(result.success).toBe(true)
    })

    it('accepts a null description', () => {
      expect(
        validateWorkoutInput(validWorkout({ description: null })).success
      ).toBe(true)
    })

    it('accepts zero rest periods', () => {
      const result = validateWorkoutInput(
        validWorkout({
          sets: [
            validSet({
              restBetweenExercises: 0,
              restBetweenRepeats: 0,
              restBetweenSets: 0,
            }),
          ],
        })
      )

      expect(result.success).toBe(true)
    })

    it('accepts values exactly at the upper bounds', () => {
      const result = validateWorkoutInput(
        validWorkout({
          name: 'a'.repeat(100),
          description: 'd'.repeat(500),
          tags: Array.from({ length: 20 }, (_, i) => `t${i}`.padEnd(50, 'x')),
          sets: [
            validSet({
              repeatCount: 100,
              restBetweenExercises: 3600,
              restBetweenRepeats: 3600,
              restBetweenSets: 3600,
              exercises: Array.from({ length: 50 }, () =>
                validExercise({ name: 'e'.repeat(100), workDuration: 3600 })
              ),
            }),
          ],
        })
      )

      expect(result.success).toBe(true)
    })

    it('strips unknown keys from the parsed data', () => {
      const result = validateWorkoutInput(
        validWorkout({ userId: 'someone-else', id: 'injected' })
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).not.toHaveProperty('userId')
        expect(result.data).not.toHaveProperty('id')
      }
    })
  })

  describe('workout-level rules', () => {
    it.each([
      ['empty name', { name: '' }, 'name', 'Workout name required'],
      ['long name', { name: 'a'.repeat(101) }, 'name', 'Workout name too long'],
      [
        'long description',
        { description: 'd'.repeat(501) },
        'description',
        'Description too long',
      ],
      [
        'too many tags',
        { tags: Array.from({ length: 21 }, (_, i) => `t${i}`) },
        'tags',
        'Too many tags',
      ],
      ['no sets', { sets: [] }, 'sets', 'At least one set required'],
      [
        'too many sets',
        { sets: Array.from({ length: 101 }, () => validSet()) },
        'sets',
        'Too many sets',
      ],
    ])('rejects %s', (_label, overrides, path, message) => {
      const errors = expectInvalid(validWorkout(overrides))
      expect(errors[path]).toBe(message)
    })

    it('rejects a tag longer than 50 characters at its index', () => {
      const errors = expectInvalid(
        validWorkout({ tags: ['ok', 'x'.repeat(51)] })
      )
      expect(Object.keys(errors)).toEqual(['tags.1'])
    })

    it('rejects a missing name', () => {
      const input: Record<string, unknown> = validWorkout()
      delete input.name
      const errors = expectInvalid(input)
      expect(errors).toHaveProperty('name')
    })

    it('rejects a non-boolean isPublic', () => {
      const errors = expectInvalid(validWorkout({ isPublic: 'yes' }))
      expect(errors).toHaveProperty('isPublic')
    })
  })

  describe('set-level rules', () => {
    it.each([
      ['repeatCount', 0, 'Repeat count must be at least 1'],
      ['repeatCount', 101, 'Repeat count cannot exceed 100'],
      ['restBetweenExercises', -1, 'Rest cannot be negative'],
      ['restBetweenExercises', 3601, 'Rest cannot exceed 1 hour'],
      ['restBetweenRepeats', -1, 'Rest cannot be negative'],
      ['restBetweenRepeats', 3601, 'Rest cannot exceed 1 hour'],
      ['restBetweenSets', -1, 'Rest cannot be negative'],
      ['restBetweenSets', 3601, 'Rest cannot exceed 1 hour'],
    ])('rejects %s = %s', (field, value, message) => {
      const errors = expectInvalid(
        validWorkout({ sets: [validSet({ [field]: value })] })
      )
      expect(errors[`sets.0.${field}`]).toBe(message)
    })

    it('rejects non-integer repeat counts', () => {
      const errors = expectInvalid(
        validWorkout({ sets: [validSet({ repeatCount: 2.5 })] })
      )
      expect(errors).toHaveProperty('sets.0.repeatCount')
    })

    it('rejects a set with no exercises', () => {
      const errors = expectInvalid(
        validWorkout({ sets: [validSet({ exercises: [] })] })
      )
      expect(errors['sets.0.exercises']).toBe(
        'Each set must have at least one exercise'
      )
    })

    it('rejects a set with more than 50 exercises', () => {
      const errors = expectInvalid(
        validWorkout({
          sets: [
            validSet({
              exercises: Array.from({ length: 51 }, () => validExercise()),
            }),
          ],
        })
      )
      expect(errors['sets.0.exercises']).toBe('Too many exercises in set')
    })
  })

  describe('exercise-level rules', () => {
    it.each([
      ['empty name', { name: '' }, 'name', 'Exercise name required'],
      [
        'long name',
        { name: 'e'.repeat(101) },
        'name',
        'Exercise name too long',
      ],
      [
        'zero duration',
        { workDuration: 0 },
        'workDuration',
        'Duration must be at least 1 second',
      ],
      [
        'duration over an hour',
        { workDuration: 3601 },
        'workDuration',
        'Duration cannot exceed 1 hour',
      ],
    ])('rejects %s', (_label, overrides, field, message) => {
      const errors = expectInvalid(
        validWorkout({
          sets: [validSet({ exercises: [validExercise(overrides)] })],
        })
      )
      expect(errors[`sets.0.exercises.0.${field}`]).toBe(message)
    })

    it('rejects a fractional duration', () => {
      const errors = expectInvalid(
        validWorkout({
          sets: [
            validSet({ exercises: [validExercise({ workDuration: 1.5 })] }),
          ],
        })
      )
      expect(errors).toHaveProperty('sets.0.exercises.0.workDuration')
    })

    it('rejects a numeric string duration (no coercion)', () => {
      const errors = expectInvalid(
        validWorkout({
          sets: [
            validSet({ exercises: [validExercise({ workDuration: '30' })] }),
          ],
        })
      )
      expect(errors).toHaveProperty('sets.0.exercises.0.workDuration')
    })

    it.each([NaN, Infinity])('rejects a duration of %s', (workDuration) => {
      const errors = expectInvalid(
        validWorkout({
          sets: [validSet({ exercises: [validExercise({ workDuration })] })],
        })
      )
      expect(errors).toHaveProperty('sets.0.exercises.0.workDuration')
    })
  })

  describe('error map', () => {
    it('reports every invalid field with a dotted path', () => {
      const errors = expectInvalid({
        name: '',
        sets: [
          validSet(),
          validSet({
            repeatCount: 0,
            exercises: [validExercise(), validExercise({ name: '' })],
          }),
        ],
      })

      expect(errors).toEqual({
        name: 'Workout name required',
        'sets.1.repeatCount': 'Repeat count must be at least 1',
        'sets.1.exercises.1.name': 'Exercise name required',
      })
    })

    it.each([null, undefined, 'workout', 42, []])(
      'rejects non-object input %j with a root error',
      (input) => {
        const errors = expectInvalid(input)
        expect(Object.keys(errors).length).toBeGreaterThan(0)
      }
    )
  })
})
