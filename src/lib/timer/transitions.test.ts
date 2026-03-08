import { describe, it, expect } from 'vitest'
import { getNextPhaseInfo } from './transitions'
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
  name: 'Test Workout',
  sets: sets.map((set, setIndex) => ({
    id: String(setIndex + 1),
    order: setIndex,
    repeatCount: set.repeatCount ?? 1,
    restBetweenExercises: set.restBetweenExercises ?? 0,
    restBetweenSets: set.restBetweenSets ?? 0,
    exercises: (set.exercises ?? [{ workDuration: 30 }]).map((ex, exIndex) => ({
      id: `${setIndex + 1}-${exIndex + 1}`,
      name: ex.name ?? `Exercise ${exIndex + 1}`,
      workDuration: ex.workDuration ?? 30,
    })),
  })),
})

describe('getNextPhaseInfo', () => {
  describe('countdown → work', () => {
    it('transitions to work phase with first exercise duration', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'countdown')
      expect(next?.phase).toBe('work')
      expect(next?.setIndex).toBe(0)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.repeat).toBe(1)
      expect(next?.time).toBe(30)
    })

    it('includes the exercise name in nextExerciseName', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'countdown')
      expect(next?.nextExerciseName).toBe('Push-ups')
    })

    it('provides correct labels for countdown → work', () => {
      const workout = createWorkout([
        {
          repeatCount: 3,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 20 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'countdown')
      expect(next?.nextSetLabel).toBe('Set 1 / 1')
      expect(next?.nextRepLabel).toBe('Rep 1 / 3')
      expect(next?.nextExerciseLabel).toBe('Exercise 1 / 2')
    })
  })

  describe('work → rest (between exercises)', () => {
    it('transitions to rest when restBetweenExercises > 0 and next exercise exists', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 10,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 30 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('rest')
      expect(next?.time).toBe(10)
      expect(next?.setIndex).toBe(0)
      expect(next?.exerciseIndex).toBe(0)
    })

    it('includes next exercise name when transitioning to rest', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 10,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 30 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextExerciseLabel).toBe('Exercise 2 / 2')
    })

    it('skips rest and goes directly to next exercise when restBetweenExercises is 0', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 0,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 25 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('work')
      expect(next?.exerciseIndex).toBe(1)
      expect(next?.time).toBe(25)
      expect(next?.nextExerciseName).toBe('Squats')
    })
  })

  describe('work → next repeat', () => {
    it('transitions to rest before repeat when restBetweenExercises > 0', () => {
      const workout = createWorkout([
        {
          repeatCount: 3,
          restBetweenExercises: 15,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('rest')
      expect(next?.time).toBe(15)
      expect(next?.repeat).toBe(1)
      expect(next?.nextExerciseName).toBe('Push-ups')
      expect(next?.nextRepLabel).toBe('Rep 2 / 3')
    })

    it('skips rest and goes directly to next repeat when restBetweenExercises is 0', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('work')
      expect(next?.repeat).toBe(2)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.nextExerciseName).toBe('Push-ups')
      expect(next?.nextRepLabel).toBe('Rep 2 / 2')
    })
  })

  describe('work → next set', () => {
    it('transitions to restBetweenSets when restBetweenSets > 0', () => {
      const workout = createWorkout([
        {
          restBetweenSets: 20,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          exercises: [{ name: 'Squats', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('restBetweenSets')
      expect(next?.time).toBe(20)
      expect(next?.setIndex).toBe(0)
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextSetLabel).toBe('Set 2 / 2')
    })

    it('transitions to rest when restBetweenExercises > 0 and restBetweenSets is 0', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 5,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          exercises: [{ name: 'Squats', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('rest')
      expect(next?.time).toBe(5)
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextSetLabel).toBe('Set 2 / 2')
    })

    it('transitions directly to work on next set when no rest configured', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          exercises: [{ name: 'Squats', workDuration: 25 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('work')
      expect(next?.setIndex).toBe(1)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.repeat).toBe(1)
      expect(next?.time).toBe(25)
      expect(next?.nextExerciseName).toBe('Squats')
    })
  })

  describe('work → complete', () => {
    it('returns complete phase when last exercise in last set is done', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('complete')
      expect(next?.time).toBe(0)
      expect(next?.nextExerciseName).toBeNull()
    })

    it('includes current position labels in complete result', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 2, 'work')
      expect(next?.phase).toBe('complete')
      expect(next?.nextSetLabel).toBe('Set 1 / 1')
      expect(next?.nextRepLabel).toBe('Rep 2 / 2')
    })
  })

  describe('rest → work', () => {
    it('transitions to next exercise after rest', () => {
      const workout = createWorkout([
        {
          restBetweenExercises: 10,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 25 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'rest')
      expect(next?.phase).toBe('work')
      expect(next?.exerciseIndex).toBe(1)
      expect(next?.time).toBe(25)
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextExerciseLabel).toBe('Exercise 2 / 2')
    })

    it('transitions to next repeat after rest when no more exercises', () => {
      const workout = createWorkout([
        {
          repeatCount: 3,
          restBetweenExercises: 10,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'rest')
      expect(next?.phase).toBe('work')
      expect(next?.repeat).toBe(2)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.nextExerciseName).toBe('Push-ups')
      expect(next?.nextRepLabel).toBe('Rep 2 / 3')
    })

    it('transitions to next set after rest when last repeat is done', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 10,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          exercises: [{ name: 'Squats', workDuration: 25 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'rest')
      expect(next?.phase).toBe('work')
      expect(next?.setIndex).toBe(1)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.repeat).toBe(1)
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextSetLabel).toBe('Set 2 / 2')
    })

    it('returns null when rest ends and there is no next set', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 10,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'rest')
      expect(next).toBeNull()
    })
  })

  describe('restBetweenSets → work', () => {
    it('transitions to first exercise of the next set', () => {
      const workout = createWorkout([
        {
          restBetweenSets: 20,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          exercises: [{ name: 'Squats', workDuration: 25 }],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'restBetweenSets')
      expect(next?.phase).toBe('work')
      expect(next?.setIndex).toBe(1)
      expect(next?.exerciseIndex).toBe(0)
      expect(next?.repeat).toBe(1)
      expect(next?.time).toBe(25)
      expect(next?.nextExerciseName).toBe('Squats')
    })

    it('provides correct labels for next set', () => {
      const workout = createWorkout([
        {
          restBetweenSets: 20,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
        {
          repeatCount: 2,
          exercises: [
            { name: 'Squats', workDuration: 25 },
            { name: 'Lunges', workDuration: 20 },
          ],
        },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'restBetweenSets')
      expect(next?.nextSetLabel).toBe('Set 2 / 2')
      expect(next?.nextRepLabel).toBe('Rep 1 / 2')
      expect(next?.nextExerciseLabel).toBe('Exercise 1 / 2')
    })

    it('returns null when restBetweenSets ends and there is no next set', () => {
      const workout = createWorkout([
        {
          restBetweenSets: 20,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      // setIndex 1 does not exist
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'restBetweenSets')
      expect(next).toBeNull()
    })
  })

  describe('edge cases', () => {
    it('returns null when setIndex is out of bounds', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 5, 0, 1, 'work')
      expect(next).toBeNull()
    })

    it('returns null when exerciseIndex is out of bounds', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 5, 1, 'work')
      expect(next).toBeNull()
    })

    it('returns null for idle phase', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'idle')
      expect(next).toBeNull()
    })

    it('returns null for complete phase', () => {
      const workout = createWorkout([
        { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
      ])
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'complete')
      expect(next).toBeNull()
    })

    it('handles multi-set multi-exercise workout labels correctly', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 10,
          exercises: [
            { name: 'Push-ups', workDuration: 30 },
            { name: 'Squats', workDuration: 25 },
          ],
        },
        {
          repeatCount: 3,
          exercises: [{ name: 'Lunges', workDuration: 20 }],
        },
      ])
      // work phase, set 0, exercise 0 → rest before exercise 1
      const next = getNextPhaseInfo(workout, 0, 0, 1, 'work')
      expect(next?.phase).toBe('rest')
      expect(next?.nextExerciseName).toBe('Squats')
      expect(next?.nextSetLabel).toBe('Set 1 / 2')
      expect(next?.nextRepLabel).toBe('Rep 1 / 2')
      expect(next?.nextExerciseLabel).toBe('Exercise 2 / 2')
    })
  })
})
