import { create } from 'zustand'
import { TimerState, TimerPhase, Workout, Exercise } from './types'

const COUNTDOWN_SECONDS = 3

function getExerciseAtIndex(
  workout: Workout,
  exerciseIndex: number
): Exercise | null {
  if (exerciseIndex >= workout.exercises.length) return null
  return workout.exercises[exerciseIndex]
}

function getNextPhase(
  workout: Workout,
  exerciseIndex: number,
  currentSet: number,
  currentPhase: TimerPhase
): {
  phase: TimerPhase
  exerciseIndex: number
  set: number
  time: number
} | null {
  const exercise = getExerciseAtIndex(workout, exerciseIndex)
  if (!exercise) return null

  if (currentPhase === 'countdown') {
    return {
      phase: 'work',
      exerciseIndex,
      set: currentSet,
      time: exercise.workDuration,
    }
  }

  if (currentPhase === 'work') {
    if (currentSet < exercise.sets) {
      return {
        phase: 'rest',
        exerciseIndex,
        set: currentSet,
        time: exercise.restDuration,
      }
    } else if (exerciseIndex + 1 < workout.exercises.length) {
      const nextExercise = workout.exercises[exerciseIndex + 1]
      if (exercise.restBetweenSets > 0) {
        return {
          phase: 'restBetweenSets',
          exerciseIndex,
          set: currentSet,
          time: exercise.restBetweenSets,
        }
      }
      return {
        phase: 'work',
        exerciseIndex: exerciseIndex + 1,
        set: 1,
        time: nextExercise.workDuration,
      }
    } else {
      return { phase: 'complete', exerciseIndex, set: currentSet, time: 0 }
    }
  }

  if (currentPhase === 'rest') {
    const nextSet = currentSet + 1
    if (nextSet <= exercise.sets) {
      return {
        phase: 'work',
        exerciseIndex,
        set: nextSet,
        time: exercise.workDuration,
      }
    }
    if (exerciseIndex + 1 < workout.exercises.length) {
      return {
        phase: 'work',
        exerciseIndex: exerciseIndex + 1,
        set: 1,
        time: workout.exercises[exerciseIndex + 1].workDuration,
      }
    }
    return { phase: 'complete', exerciseIndex, set: currentSet, time: 0 }
  }

  if (currentPhase === 'restBetweenSets') {
    return {
      phase: 'work',
      exerciseIndex: exerciseIndex + 1,
      set: 1,
      time: workout.exercises[exerciseIndex + 1].workDuration,
    }
  }

  return null
}

export const useTimerStore = create<TimerState>((set, get) => ({
  workout: null,
  phase: 'idle',
  currentExerciseIndex: 0,
  currentSet: 1,
  timeRemaining: 0,
  totalTimeElapsed: 0,
  isRunning: false,

  loadWorkout: (workout: Workout) => {
    set({
      workout,
      phase: 'idle',
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  },

  start: () => {
    const { workout } = get()
    if (!workout || workout.exercises.length === 0) return

    set({
      phase: 'countdown',
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: COUNTDOWN_SECONDS,
      totalTimeElapsed: 0,
      isRunning: true,
    })
  },

  pause: () => set({ isRunning: false }),

  resume: () => set({ isRunning: true }),

  skip: () => {
    const { workout, currentExerciseIndex, currentSet, phase } = get()
    if (!workout) return

    const next = getNextPhase(workout, currentExerciseIndex, currentSet, phase)
    if (next) {
      set({
        phase: next.phase,
        currentExerciseIndex: next.exerciseIndex,
        currentSet: next.set,
        timeRemaining: next.time,
      })
    }
  },

  stop: () => {
    set({
      phase: 'idle',
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      isRunning: false,
    })
  },

  tick: () => {
    const {
      phase,
      timeRemaining,
      totalTimeElapsed,
      workout,
      currentExerciseIndex,
      currentSet,
    } = get()
    if (!workout || !get().isRunning) return

    if (timeRemaining <= 1) {
      const next = getNextPhase(
        workout,
        currentExerciseIndex,
        currentSet,
        phase
      )
      if (next) {
        set({
          phase: next.phase,
          currentExerciseIndex: next.exerciseIndex,
          currentSet: next.set,
          timeRemaining: next.time,
          totalTimeElapsed: totalTimeElapsed + 1,
          isRunning: next.phase !== 'complete',
        })
      }
    } else {
      set({
        timeRemaining: timeRemaining - 1,
        totalTimeElapsed: totalTimeElapsed + 1,
      })
    }
  },
}))
