export interface Exercise {
  id: string
  name: string
  workDuration: number
  restDuration: number
  sets: number
  restBetweenSets: number
}

export interface Workout {
  id: string
  name: string
  description?: string
  exercises: Exercise[]
}

export type TimerPhase =
  | 'idle'
  | 'countdown'
  | 'work'
  | 'rest'
  | 'restBetweenSets'
  | 'complete'

export interface TimerState {
  workout: Workout | null
  phase: TimerPhase
  currentExerciseIndex: number
  currentSet: number
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
  return workout.exercises.reduce((total, ex) => {
    const setTime = (ex.workDuration + ex.restDuration) * ex.sets
    const restBetweenSetsTime = ex.restBetweenSets * (ex.sets - 1)
    return total + setTime + restBetweenSetsTime
  }, 0)
}
