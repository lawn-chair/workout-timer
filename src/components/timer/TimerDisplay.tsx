import { useTimerStore } from '@/lib/timer/store'
import { TimerPhase, getTotalWorkoutTime } from '@/lib/timer/types'

const phaseColors: Record<TimerPhase, string> = {
  idle: 'bg-[#0c0f12]',
  countdown: 'phase-band phase-countdown',
  work: 'phase-band phase-work',
  rest: 'phase-band phase-rest',
  restBetweenSets: 'phase-band phase-rest-sets',
  complete: 'phase-band phase-complete',
}

const phaseLabels: Record<TimerPhase, string> = {
  idle: 'Ready',
  countdown: 'Get Ready',
  work: 'Work',
  rest: 'Rest',
  restBetweenSets: 'Rest Between Sets',
  complete: 'Complete!',
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getNextUpLabel(
  phase: TimerPhase,
  workout: ReturnType<typeof useTimerStore.getState>['workout'],
  currentSetIndex: number,
  currentExerciseIndex: number,
  currentRepeat: number
): string {
  if (!workout) return 'Next: --'
  if (phase === 'idle') return 'Next: Start when ready'
  if (phase === 'complete') return 'Next: Session complete'

  const currentSet = workout.sets[currentSetIndex]
  if (!currentSet) return 'Next: --'

  if (phase === 'countdown') {
    const firstExercise = currentSet.exercises[0]
    return `Next: ${firstExercise?.name || 'Exercise'}`
  }

  if (phase === 'work') {
    const nextExercise = currentSet.exercises[currentExerciseIndex + 1]
    if (nextExercise) return `Next: ${nextExercise.name}`
    if (currentRepeat < currentSet.repeatCount) {
      const firstExercise = currentSet.exercises[0]
      return `Next: ${firstExercise?.name || 'Exercise'}`
    }
    if (currentSetIndex < workout.sets.length - 1) {
      return `Next: Set ${currentSetIndex + 2}`
    }
    return 'Next: Finish'
  }

  if (phase === 'rest') {
    const nextExercise = currentSet.exercises[currentExerciseIndex + 1]
    return `Next: ${nextExercise?.name || 'Exercise'}`
  }

  if (phase === 'restBetweenSets') {
    return `Next: Set ${currentSetIndex + 2}`
  }

  return 'Next: --'
}

interface DisplayedExercise {
  name: string
  isUpcoming: boolean
  setLabel: string
  repLabel: string
  exerciseLabel: string
}

function getDisplayedExercise(
  phase: TimerPhase,
  workout: ReturnType<typeof useTimerStore.getState>['workout'],
  currentSetIndex: number,
  currentExerciseIndex: number,
  currentRepeat: number
): DisplayedExercise {
  const defaultResult: DisplayedExercise = {
    name: 'Exercise',
    isUpcoming: false,
    setLabel: '',
    repLabel: '',
    exerciseLabel: '',
  }

  if (!workout) return defaultResult

  const currentSet = workout.sets[currentSetIndex]
  if (!currentSet) return defaultResult

  const currentExercise = currentSet.exercises[currentExerciseIndex]
  const totalSets = workout.sets.length
  const totalExercises = currentSet.exercises.length
  const totalRepeats = currentSet.repeatCount

  if (
    phase === 'idle' ||
    phase === 'countdown' ||
    phase === 'work' ||
    phase === 'complete'
  ) {
    return {
      name: currentExercise?.name || 'Exercise',
      isUpcoming: false,
      setLabel: `Set ${currentSetIndex + 1} / ${totalSets}`,
      repLabel: `Rep ${currentRepeat} / ${totalRepeats}`,
      exerciseLabel: `Exercise ${currentExerciseIndex + 1} / ${totalExercises}`,
    }
  }

  if (phase === 'rest') {
    const nextExerciseInSet = currentSet.exercises[currentExerciseIndex + 1]
    const currentExercise = currentSet.exercises[0]
    if (nextExerciseInSet) {
      return {
        name: nextExerciseInSet.name,
        isUpcoming: true,
        setLabel: `Set ${currentSetIndex + 1} / ${totalSets}`,
        repLabel: `Rep ${currentRepeat} / ${totalRepeats}`,
        exerciseLabel: `Exercise ${currentExerciseIndex + 2} / ${totalExercises}`,
      }
    }

    if (currentRepeat < totalRepeats) {
      return {
        name: currentExercise?.name || 'Exercise',
        isUpcoming: true,
        setLabel: `Set ${currentSetIndex + 1} / ${totalSets}`,
        repLabel: `Rep ${currentRepeat + 1} / ${totalRepeats}`,
        exerciseLabel: `Exercise 1 / ${totalExercises}`,
      }
    }

    if (currentSetIndex < totalSets - 1) {
      const nextSet = workout.sets[currentSetIndex + 1]
      const nextSetFirstExercise = nextSet?.exercises[0]
      return {
        name: nextSetFirstExercise?.name || 'Exercise',
        isUpcoming: true,
        setLabel: `Set ${currentSetIndex + 2} / ${totalSets}`,
        repLabel: `Rep 1 / ${nextSet?.repeatCount || 1}`,
        exerciseLabel: `Exercise 1 / ${nextSet?.exercises.length || 1}`,
      }
    }

    return {
      name: 'Workout Complete!',
      isUpcoming: true,
      setLabel: `Set ${currentSetIndex + 1} / ${totalSets}`,
      repLabel: `Rep ${currentRepeat} / ${totalRepeats}`,
      exerciseLabel: `Exercise ${currentExerciseIndex + 1} / ${totalExercises}`,
    }
  }

  if (phase === 'restBetweenSets') {
    const nextSet = workout.sets[currentSetIndex + 1]
    const nextSetFirstExercise = nextSet?.exercises[0]
    return {
      name: nextSetFirstExercise?.name || 'Exercise',
      isUpcoming: true,
      setLabel: `Set ${currentSetIndex + 2} / ${totalSets}`,
      repLabel: `Rep 1 / ${nextSet?.repeatCount || 1}`,
      exerciseLabel: `Exercise 1 / ${nextSet?.exercises.length || 1}`,
    }
  }

  return defaultResult
}

interface TimerDisplayProps {
  showWakeLockNotice: boolean
}

export default function TimerDisplay({
  showWakeLockNotice,
}: TimerDisplayProps) {
  const {
    phase,
    timeRemaining,
    workout,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat,
    totalTimeElapsed,
  } = useTimerStore()

  const currentSet = workout?.sets[currentSetIndex]
  const totalTime = workout ? getTotalWorkoutTime(workout) : 0
  const progressPercent = totalTime
    ? Math.min((totalTimeElapsed / totalTime) * 100, 100)
    : 0
  const nextUpLabel = getNextUpLabel(
    phase,
    workout,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat
  )
  const displayedExercise = getDisplayedExercise(
    phase,
    workout,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat
  )

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${phaseColors[phase]} transition-colors duration-500 px-5`}
      data-testid="timer-display"
    >
      <div className="text-center text-white max-w-3xl">
        {phase === 'complete' ? (
          <div>
            <h1 className="display-font text-6xl md:text-7xl mb-4">
              Workout Complete!
            </h1>
            <p className="text-lg text-white/80">Great job!</p>
          </div>
        ) : (
          <>
            <p
              className="text-xs uppercase tracking-[0.45em] mb-4 text-white/80"
              data-testid="timer-phase"
            >
              {phaseLabels[phase]}
            </p>

            <p className="text-3xl md:text-4xl font-semibold mb-2">
              {displayedExercise.isUpcoming && phase !== 'restBetweenSets'
                ? `Up Next: ${displayedExercise.name}`
                : displayedExercise.name}
            </p>

            {currentSet && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/70 mb-6">
                <span className="px-3 py-1 rounded-full border border-white/20">
                  {displayedExercise.setLabel}
                </span>
                {displayedExercise.repLabel && (
                  <span className="px-3 py-1 rounded-full border border-white/20">
                    {displayedExercise.repLabel}
                  </span>
                )}
                {displayedExercise.exerciseLabel && (
                  <span className="px-3 py-1 rounded-full border border-white/20">
                    {displayedExercise.exerciseLabel}
                  </span>
                )}
              </div>
            )}

            <p className="display-font text-[7rem] md:text-[10rem] leading-none tabular-nums">
              {formatTime(timeRemaining)}
            </p>
            <div className="mt-6 w-full max-w-lg mx-auto space-y-3">
              <div className="flex justify-between text-xs text-white/70">
                {phase !== 'rest' && phase !== 'restBetweenSets' && (
                  <span>{nextUpLabel}</span>
                )}
                <span>
                  {formatTime(totalTimeElapsed)} /{' '}
                  {formatTime(Math.max(totalTime, 0))}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white/90 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-white/70 mt-4">
              Stay focused. The next cue is coming.
            </p>
            {showWakeLockNotice && (
              <p className="text-xs text-white/60 mt-3">
                Keep screen awake isn&apos;t supported on this device.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
