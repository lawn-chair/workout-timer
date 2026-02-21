import { describe, it, expect, beforeEach } from 'vitest'
import { useTimerStore } from './store'
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
      name: ex.name || `Exercise ${exIndex + 1}`,
      workDuration: ex.workDuration ?? 30,
      order: exIndex,
    })),
  })),
})

const tickUntil = (targetPhase: string, maxTicks = 100) => {
  for (let i = 0; i < maxTicks; i++) {
    if (useTimerStore.getState().phase === targetPhase) return true
    useTimerStore.getState().tick()
  }
  return false
}

describe('useTimerStore', () => {
  beforeEach(() => {
    useTimerStore.setState({
      workout: null,
      phase: 'idle',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  })

  describe('loadWorkout', () => {
    it('should load a workout and set state to idle', () => {
      const workout = createWorkout([
        {
          repeatCount: 3,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])

      useTimerStore.getState().loadWorkout(workout)

      const state = useTimerStore.getState()
      expect(state.workout).toEqual(workout)
      expect(state.phase).toBe('idle')
      expect(state.currentExerciseIndex).toBe(0)
      expect(state.currentSetIndex).toBe(0)
      expect(state.currentRepeat).toBe(1)
      expect(state.isRunning).toBe(false)
    })
  })

  describe('start', () => {
    it('should start countdown when workout exists', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)

      useTimerStore.getState().start()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('countdown')
      expect(state.timeRemaining).toBe(3)
      expect(state.isRunning).toBe(true)
    })

    it('should not start if no workout loaded', () => {
      useTimerStore.getState().start()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('idle')
      expect(state.isRunning).toBe(false)
    })

    it('should not start if workout has no exercises', () => {
      const workout = createWorkout([])
      useTimerStore.getState().loadWorkout(workout)

      useTimerStore.getState().start()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('idle')
    })
  })

  describe('pause/resume', () => {
    it('should pause the timer', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups' }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().pause()

      expect(useTimerStore.getState().isRunning).toBe(false)
    })

    it('should resume the timer', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups' }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()
      useTimerStore.getState().pause()

      useTimerStore.getState().resume()

      expect(useTimerStore.getState().isRunning).toBe(true)
    })
  })

  describe('stop', () => {
    it('should stop and reset to idle', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups' }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().stop()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('idle')
      expect(state.currentExerciseIndex).toBe(0)
      expect(state.currentSetIndex).toBe(0)
      expect(state.currentRepeat).toBe(1)
      expect(state.isRunning).toBe(false)
    })
  })

  describe('tick - countdown phase', () => {
    it('should transition from countdown to work after countdown ends', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().tick()
      useTimerStore.getState().tick()
      useTimerStore.getState().tick()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.timeRemaining).toBe(30)
    })

    it('should decrement countdown time', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups' }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().timeRemaining).toBe(2)
    })
  })

  describe('tick - work phase', () => {
    it('should transition from work to rest between exercises', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 10,
          restBetweenSets: 0,
          exercises: [
            { name: 'Push-ups', workDuration: 2 },
            { name: 'Sit-ups', workDuration: 2 },
          ],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')
    })

    it('should rest between repeats when rest is configured', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 3,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')

      tickUntil('rest')
      const state = useTimerStore.getState()
      expect(state.phase).toBe('rest')
      expect(state.timeRemaining).toBe(3)
    })

    it('should increment total time elapsed', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().totalTimeElapsed).toBe(1)
    })
  })

  describe('tick - rest phase', () => {
    it('should transition from rest to work for next exercise', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 1,
          restBetweenSets: 0,
          exercises: [
            { name: 'Push-ups', workDuration: 1 },
            { name: 'Sit-ups', workDuration: 1 },
          ],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      const stateBefore = useTimerStore.getState()
      expect(stateBefore.phase).toBe('work')

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')

      tickUntil('work')
      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentExerciseIndex).toBe(1)
    })

    it('should transition from rest to work for next repeat', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 1,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')
      expect(useTimerStore.getState().currentRepeat).toBe(1)

      tickUntil('work')
      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentRepeat).toBe(2)
      expect(state.currentExerciseIndex).toBe(0)
    })

    it('should transition from rest between sets to next set', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 2,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Squats', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentExerciseIndex).toBe(0)

      tickUntil('restBetweenSets')
      expect(useTimerStore.getState().phase).toBe('restBetweenSets')

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentSetIndex).toBe(1)
    })
  })

  describe('tick - restBetweenSets', () => {
    it('should enter rest between sets phase after completing a set', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 0,
          restBetweenSets: 5,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Squats', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentRepeat).toBe(1)

      tickUntil('restBetweenSets')
      expect(useTimerStore.getState().phase).toBe('restBetweenSets')
      expect(useTimerStore.getState().timeRemaining).toBe(5)

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentSetIndex).toBe(1)
    })

    it('should transition to next exercise after rest between sets', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 0,
          restBetweenSets: 2,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Squats', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('restBetweenSets')
      expect(useTimerStore.getState().phase).toBe('restBetweenSets')

      useTimerStore.getState().tick()
      useTimerStore.getState().tick()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentSetIndex).toBe(1)
    })
  })

  describe('tick - complete', () => {
    it('should complete workout when all exercises and sets done', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      const completed = tickUntil('complete', 20)

      expect(completed).toBe(true)
      const state = useTimerStore.getState()
      expect(state.phase).toBe('complete')
      expect(state.isRunning).toBe(false)
    })

    it('should complete after multiple exercises', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Squats', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      const completed = tickUntil('complete', 30)

      expect(completed).toBe(true)
      expect(useTimerStore.getState().phase).toBe('complete')
    })
  })

  describe('skip', () => {
    it('should skip to next phase', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 30 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().skip()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.timeRemaining).toBe(30)
    })
  })

  describe('edge cases', () => {
    it('should not tick when not running', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups' }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()
      useTimerStore.getState().pause()
      const initialTime = useTimerStore.getState().timeRemaining

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().timeRemaining).toBe(initialTime)
    })

    it('should handle workout with many sets', () => {
      const workout = createWorkout([
        {
          repeatCount: 5,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('complete', 30)

      expect(useTimerStore.getState().currentRepeat).toBe(5)
    })

    it('should skip rest between exercises when rest is zero', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [
            { name: 'Push-ups', workDuration: 1 },
            { name: 'Squats', workDuration: 1 },
          ],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().currentExerciseIndex).toBe(0)

      useTimerStore.getState().tick()
      expect(useTimerStore.getState().currentExerciseIndex).toBe(1)
    })

    it('should skip rest between repeats when rest is zero', () => {
      const workout = createWorkout([
        {
          repeatCount: 2,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().currentRepeat).toBe(1)

      useTimerStore.getState().tick()
      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentRepeat).toBe(2)
      expect(state.currentExerciseIndex).toBe(0)
    })

    it('should complete single exercise single set workout', () => {
      const workout = createWorkout([
        {
          repeatCount: 1,
          restBetweenExercises: 0,
          restBetweenSets: 0,
          exercises: [{ name: 'Push-ups', workDuration: 1 }],
        },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      const completed = tickUntil('complete', 10)

      expect(completed).toBe(true)
    })
  })
})
