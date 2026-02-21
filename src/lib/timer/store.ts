import { create } from 'zustand'
import {
  TimerState,
  TimerPhase,
  Workout,
  WorkoutSet,
  SetExercise,
} from './types'

const COUNTDOWN_SECONDS = 3

function getSetAtIndex(workout: Workout, setIndex: number): WorkoutSet | null {
  if (setIndex >= workout.sets.length) return null
  return workout.sets[setIndex]
}

function getExerciseAtIndex(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number
): SetExercise | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set) return null
  if (exerciseIndex >= set.exercises.length) return null
  return set.exercises[exerciseIndex]
}

function getNextPhase(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number,
  currentRepeat: number,
  currentPhase: TimerPhase
): {
  phase: TimerPhase
  setIndex: number
  exerciseIndex: number
  repeat: number
  time: number
} | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set) return null
  const exercise = getExerciseAtIndex(workout, setIndex, exerciseIndex)
  if (!exercise) return null

  if (currentPhase === 'countdown') {
    return {
      phase: 'work',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: exercise.workDuration,
    }
  }

  if (currentPhase === 'work') {
    const isLastExercise = exerciseIndex >= set.exercises.length - 1
    if (!isLastExercise) {
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
        }
      }
      const nextExercise = set.exercises[exerciseIndex + 1]
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: exerciseIndex + 1,
        repeat: currentRepeat,
        time: nextExercise.workDuration,
      }
    }

    if (currentRepeat < set.repeatCount) {
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
        }
      }
      const firstExercise = set.exercises[0]
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstExercise.workDuration,
      }
    }

    if (setIndex < workout.sets.length - 1) {
      if (set.restBetweenSets > 0) {
        return {
          phase: 'restBetweenSets',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenSets,
        }
      }
      const nextSet = workout.sets[setIndex + 1]
      const nextExercise = nextSet.exercises[0]
      return {
        phase: 'work',
        setIndex: setIndex + 1,
        exerciseIndex: 0,
        repeat: 1,
        time: nextExercise.workDuration,
      }
    }

    return {
      phase: 'complete',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: 0,
    }
  }

  if (currentPhase === 'rest') {
    const nextExercise = set.exercises[exerciseIndex + 1]
    if (nextExercise) {
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: exerciseIndex + 1,
        repeat: currentRepeat,
        time: nextExercise.workDuration,
      }
    }
    if (currentRepeat < set.repeatCount) {
      const firstExercise = set.exercises[0]
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstExercise.workDuration,
      }
    }
    return null
  }

  if (currentPhase === 'restBetweenSets') {
    const nextSet = workout.sets[setIndex + 1]
    if (!nextSet) return null
    const nextExercise = nextSet.exercises[0]
    return {
      phase: 'work',
      setIndex: setIndex + 1,
      exerciseIndex: 0,
      repeat: 1,
      time: nextExercise.workDuration,
    }
  }

  return null
}

export const useTimerStore = create<TimerState>((set, get) => ({
  workout: null,
  phase: 'idle',
  currentSetIndex: 0,
  currentExerciseIndex: 0,
  currentRepeat: 1,
  timeRemaining: 0,
  totalTimeElapsed: 0,
  isRunning: false,

  loadWorkout: (workout: Workout) => {
    set({
      workout,
      phase: 'idle',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  },

  start: () => {
    const { workout } = get()
    if (!workout || workout.sets.length === 0) return

    set({
      phase: 'countdown',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      timeRemaining: COUNTDOWN_SECONDS,
      totalTimeElapsed: 0,
      isRunning: true,
    })
  },

  pause: () => set({ isRunning: false }),

  resume: () => set({ isRunning: true }),

  skip: () => {
    const {
      workout,
      currentSetIndex,
      currentExerciseIndex,
      currentRepeat,
      phase,
    } = get()
    if (!workout) return

    const next = getNextPhase(
      workout,
      currentSetIndex,
      currentExerciseIndex,
      currentRepeat,
      phase
    )
    if (next) {
      set({
        phase: next.phase,
        currentSetIndex: next.setIndex,
        currentExerciseIndex: next.exerciseIndex,
        currentRepeat: next.repeat,
        timeRemaining: next.time,
      })
    }
  },

  stop: () => {
    set({
      phase: 'idle',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
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
      currentSetIndex,
      currentExerciseIndex,
      currentRepeat,
    } = get()
    if (!workout || !get().isRunning) return

    if (timeRemaining <= 1) {
      const next = getNextPhase(
        workout,
        currentSetIndex,
        currentExerciseIndex,
        currentRepeat,
        phase
      )
      if (next) {
        set({
          phase: next.phase,
          currentSetIndex: next.setIndex,
          currentExerciseIndex: next.exerciseIndex,
          currentRepeat: next.repeat,
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
