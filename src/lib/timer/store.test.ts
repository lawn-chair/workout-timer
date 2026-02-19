import { describe, it, expect, beforeEach } from 'vitest'
import { useTimerStore } from './store'
import { Workout } from './types'

const createWorkout = (
  exercises: Partial<Workout['exercises'][0]>[]
): Workout => ({
  id: '1',
  name: 'Test Workout',
  exercises: exercises.map((e, i) => ({
    id: String(i + 1),
    name: e.name || `Exercise ${i + 1}`,
    workDuration: e.workDuration ?? 30,
    restDuration: e.restDuration ?? 10,
    sets: e.sets ?? 1,
    restBetweenSets: e.restBetweenSets ?? 0,
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
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  })

  describe('loadWorkout', () => {
    it('should load a workout and set state to idle', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 30, restDuration: 10, sets: 3 },
      ])

      useTimerStore.getState().loadWorkout(workout)

      const state = useTimerStore.getState()
      expect(state.workout).toEqual(workout)
      expect(state.phase).toBe('idle')
      expect(state.currentExerciseIndex).toBe(0)
      expect(state.currentSet).toBe(1)
      expect(state.isRunning).toBe(false)
    })
  })

  describe('start', () => {
    it('should start countdown when workout exists', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 30, restDuration: 10, sets: 1 },
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
      const workout = createWorkout([{ name: 'Push-ups' }])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().pause()

      expect(useTimerStore.getState().isRunning).toBe(false)
    })

    it('should resume the timer', () => {
      const workout = createWorkout([{ name: 'Push-ups' }])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()
      useTimerStore.getState().pause()

      useTimerStore.getState().resume()

      expect(useTimerStore.getState().isRunning).toBe(true)
    })
  })

  describe('stop', () => {
    it('should stop and reset to idle', () => {
      const workout = createWorkout([{ name: 'Push-ups' }])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().stop()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('idle')
      expect(state.currentExerciseIndex).toBe(0)
      expect(state.currentSet).toBe(1)
      expect(state.isRunning).toBe(false)
    })
  })

  describe('tick - countdown phase', () => {
    it('should transition from countdown to work after countdown ends', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 30, restDuration: 10, sets: 1 },
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
      const workout = createWorkout([{ name: 'Push-ups' }])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().timeRemaining).toBe(2)
    })
  })

  describe('tick - work phase', () => {
    it('should transition from work to rest', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 2, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')
      expect(useTimerStore.getState().timeRemaining).toBe(10)
    })

    it('should increment total time elapsed', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 30, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().totalTimeElapsed).toBe(1)
    })
  })

  describe('tick - rest phase', () => {
    it('should transition from rest to work for next set', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 1, sets: 2 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      const stateBefore = useTimerStore.getState()
      expect(stateBefore.phase).toBe('work')

      tickUntil('rest')
      tickUntil('work')

      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentSet).toBe(2)
    })

    it('should transition from rest to next exercise when sets complete', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 1, sets: 1 },
        { name: 'Squats', workDuration: 30, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentExerciseIndex).toBe(0)

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentExerciseIndex).toBe(1)
    })
  })

  describe('tick - restBetweenSets', () => {
    it('should enter rest between sets phase after completing a set', () => {
      const workout = createWorkout([
        {
          name: 'Push-ups',
          workDuration: 1,
          restDuration: 1,
          sets: 2,
          restBetweenSets: 5,
        },
        { name: 'Squats', workDuration: 30, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentSet).toBe(1)

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')

      tickUntil('work')
      expect(useTimerStore.getState().phase).toBe('work')
      expect(useTimerStore.getState().currentSet).toBe(2)

      tickUntil('rest')
      expect(useTimerStore.getState().phase).toBe('rest')

      tickUntil('restBetweenSets')
      expect(useTimerStore.getState().phase).toBe('restBetweenSets')
      expect(useTimerStore.getState().timeRemaining).toBe(5)
    })

    it('should transition to next exercise after rest between sets', () => {
      const workout = createWorkout([
        {
          name: 'Push-ups',
          workDuration: 1,
          restDuration: 1,
          sets: 2,
          restBetweenSets: 2,
        },
        { name: 'Squats', workDuration: 30, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('restBetweenSets')
      expect(useTimerStore.getState().phase).toBe('restBetweenSets')

      useTimerStore.getState().tick()
      useTimerStore.getState().tick()

      const state = useTimerStore.getState()
      expect(state.phase).toBe('work')
      expect(state.currentExerciseIndex).toBe(1)
    })
  })

  describe('tick - complete', () => {
    it('should complete workout when all exercises and sets done', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 1, sets: 1 },
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
        { name: 'Push-ups', workDuration: 1, restDuration: 1, sets: 1 },
        { name: 'Squats', workDuration: 1, restDuration: 1, sets: 1 },
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
        { name: 'Push-ups', workDuration: 30, restDuration: 10, sets: 1 },
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
      const workout = createWorkout([{ name: 'Push-ups' }])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()
      useTimerStore.getState().pause()
      const initialTime = useTimerStore.getState().timeRemaining

      useTimerStore.getState().tick()

      expect(useTimerStore.getState().timeRemaining).toBe(initialTime)
    })

    it('should handle workout with many sets', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 1, sets: 5 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('complete', 30)

      expect(useTimerStore.getState().currentSet).toBe(5)
    })

    it('should skip rest when rest duration is zero', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 0, sets: 1 },
        { name: 'Squats', workDuration: 30, restDuration: 10, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      tickUntil('work')
      expect(useTimerStore.getState().currentExerciseIndex).toBe(0)

      let reachedExercise2 = false
      for (let i = 0; i < 15; i++) {
        if (useTimerStore.getState().currentExerciseIndex === 1) {
          reachedExercise2 = true
          break
        }
        useTimerStore.getState().tick()
      }

      expect(reachedExercise2).toBe(true)
    })

    it('should complete single exercise single set workout', () => {
      const workout = createWorkout([
        { name: 'Push-ups', workDuration: 1, restDuration: 0, sets: 1 },
      ])
      useTimerStore.getState().loadWorkout(workout)
      useTimerStore.getState().start()

      const completed = tickUntil('complete', 10)

      expect(completed).toBe(true)
    })
  })
})
