import { TimerPhase, Workout, WorkoutSet, SetExercise } from './types'

export interface NextInfo {
  // For the store (phase transitions)
  phase: TimerPhase
  setIndex: number
  exerciseIndex: number
  repeat: number
  time: number

  // For the display (labels)
  nextExerciseName: string | null
  nextSetLabel: string       // e.g. "Set 2 / 3"
  nextRepLabel: string       // e.g. "Rep 1 / 4"
  nextExerciseLabel: string  // e.g. "Exercise 1 / 5"
}

function getSetAtIndex(workout: Workout, setIndex: number): WorkoutSet | null {
  return setIndex < workout.sets.length ? workout.sets[setIndex] : null
}

function getExerciseAtIndex(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number
): SetExercise | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set || exerciseIndex >= set.exercises.length) return null
  return set.exercises[exerciseIndex]
}

function makeLabels(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number,
  repeat: number
): Pick<NextInfo, 'nextSetLabel' | 'nextRepLabel' | 'nextExerciseLabel'> {
  const set = workout.sets[setIndex]
  return {
    nextSetLabel: `Set ${setIndex + 1} / ${workout.sets.length}`,
    nextRepLabel: `Rep ${repeat} / ${set?.repeatCount ?? 1}`,
    nextExerciseLabel: `Exercise ${exerciseIndex + 1} / ${set?.exercises.length ?? 1}`,
  }
}

export function getNextPhaseInfo(
  workout: Workout,
  setIndex: number,
  exerciseIndex: number,
  currentRepeat: number,
  currentPhase: TimerPhase
): NextInfo | null {
  const set = getSetAtIndex(workout, setIndex)
  if (!set) return null
  const exercise = getExerciseAtIndex(workout, setIndex, exerciseIndex)
  if (!exercise) return null

  // countdown → work
  if (currentPhase === 'countdown') {
    return {
      phase: 'work',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: exercise.workDuration,
      nextExerciseName: exercise.name,
      ...makeLabels(workout, setIndex, exerciseIndex, currentRepeat),
    }
  }

  if (currentPhase === 'work') {
    const isLastExercise = exerciseIndex >= set.exercises.length - 1

    // More exercises in this set
    if (!isLastExercise) {
      const nextEx = set.exercises[exerciseIndex + 1]
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: nextEx.name,
          ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
        }
      }
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: exerciseIndex + 1,
        repeat: currentRepeat,
        time: nextEx.workDuration,
        nextExerciseName: nextEx.name,
        ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
      }
    }

    // More repeats of this set
    if (currentRepeat < set.repeatCount) {
      const firstEx = set.exercises[0]
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: firstEx.name,
          ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
        }
      }
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstEx.workDuration,
        nextExerciseName: firstEx.name,
        ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
      }
    }

    // More sets in the workout
    if (setIndex < workout.sets.length - 1) {
      const nextSet = workout.sets[setIndex + 1]
      const nextEx = nextSet?.exercises[0]

      if (set.restBetweenSets > 0) {
        return {
          phase: 'restBetweenSets',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenSets,
          nextExerciseName: nextEx?.name ?? null,
          ...makeLabels(workout, setIndex + 1, 0, 1),
        }
      }
      if (set.restBetweenExercises > 0) {
        return {
          phase: 'rest',
          setIndex,
          exerciseIndex,
          repeat: currentRepeat,
          time: set.restBetweenExercises,
          nextExerciseName: nextEx?.name ?? null,
          ...makeLabels(workout, setIndex + 1, 0, 1),
        }
      }
      if (!nextSet) return null
      return {
        phase: 'work',
        setIndex: setIndex + 1,
        exerciseIndex: 0,
        repeat: 1,
        time: nextEx!.workDuration,
        nextExerciseName: nextEx!.name,
        ...makeLabels(workout, setIndex + 1, 0, 1),
      }
    }

    // Workout complete
    return {
      phase: 'complete',
      setIndex,
      exerciseIndex,
      repeat: currentRepeat,
      time: 0,
      nextExerciseName: null,
      ...makeLabels(workout, setIndex, exerciseIndex, currentRepeat),
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
        nextExerciseName: nextExercise.name,
        ...makeLabels(workout, setIndex, exerciseIndex + 1, currentRepeat),
      }
    }
    if (currentRepeat < set.repeatCount) {
      const firstEx = set.exercises[0]
      return {
        phase: 'work',
        setIndex,
        exerciseIndex: 0,
        repeat: currentRepeat + 1,
        time: firstEx.workDuration,
        nextExerciseName: firstEx.name,
        ...makeLabels(workout, setIndex, 0, currentRepeat + 1),
      }
    }
    const nextSet = workout.sets[setIndex + 1]
    if (!nextSet) return null
    const nextEx = nextSet.exercises[0]
    return {
      phase: 'work',
      setIndex: setIndex + 1,
      exerciseIndex: 0,
      repeat: 1,
      time: nextEx.workDuration,
      nextExerciseName: nextEx.name,
      ...makeLabels(workout, setIndex + 1, 0, 1),
    }
  }

  if (currentPhase === 'restBetweenSets') {
    const nextSet = workout.sets[setIndex + 1]
    if (!nextSet) return null
    const nextEx = nextSet.exercises[0]
    return {
      phase: 'work',
      setIndex: setIndex + 1,
      exerciseIndex: 0,
      repeat: 1,
      time: nextEx.workDuration,
      nextExerciseName: nextEx.name,
      ...makeLabels(workout, setIndex + 1, 0, 1),
    }
  }

  return null
}
