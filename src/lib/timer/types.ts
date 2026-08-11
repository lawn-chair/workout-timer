export interface SetExercise {
  id: string
  name: string
  workDuration: number
}

export interface WorkoutSet {
  id: string
  order: number
  repeatCount: number
  restBetweenExercises: number
  restBetweenRepeats: number
  restBetweenSets: number
  exercises: SetExercise[]
}

export interface Workout {
  id: string
  name: string
  description?: string
  sets: WorkoutSet[]
}

export type TimerPhase =
  'idle' | 'countdown' | 'work' | 'rest' | 'restBetweenSets' | 'complete'

export interface TimerState {
  workout: Workout | null
  phase: TimerPhase
  currentSetIndex: number
  currentExerciseIndex: number
  currentRepeat: number
  timeRemaining: number
  totalTimeElapsed: number
  isRunning: boolean

  loadWorkout: (workout: Workout) => void
  start: () => void
  pause: () => void
  resume: () => void
  skip: () => void
  stop: () => void
  tick: () => void
}

export function getTotalWorkoutTime(workout: Workout): number {
  return workout.sets.reduce((total, set, setIndex) => {
    const exerciseWork = set.exercises.reduce(
      (sum, ex) => sum + ex.workDuration,
      0
    )
    const restBetweenExercisesTime =
      set.restBetweenExercises * Math.max(set.exercises.length - 1, 0)
    const setTime = exerciseWork + restBetweenExercisesTime
    const repeatCount = Math.max(set.repeatCount, 1)
    const restBetweenRepeatsTime =
      Math.max(repeatCount - 1, 0) * set.restBetweenRepeats
    const repeatedTime = setTime * repeatCount + restBetweenRepeatsTime
    const restBetweenSetsTime =
      setIndex < workout.sets.length - 1
        ? set.restBetweenSets > 0
          ? set.restBetweenSets
          : set.restBetweenExercises
        : 0
    return total + repeatedTime + restBetweenSetsTime
  }, 0)
}
