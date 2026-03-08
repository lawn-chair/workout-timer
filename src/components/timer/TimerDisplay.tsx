import { useTimerStore } from '@/lib/timer/store'
import { TimerPhase, getTotalWorkoutTime } from '@/lib/timer/types'
import { getNextPhaseInfo } from '@/lib/timer/transitions'

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
  const currentExercise = currentSet?.exercises[currentExerciseIndex]
  const totalTime = workout ? getTotalWorkoutTime(workout) : 0
  const progressPercent = totalTime
    ? Math.min((totalTimeElapsed / totalTime) * 100, 100)
    : 0

  // Get next phase info from the shared transition function
  const nextInfo = workout
    ? getNextPhaseInfo(workout, currentSetIndex, currentExerciseIndex, currentRepeat, phase)
    : null

  const isUpcoming = phase === 'rest' || phase === 'restBetweenSets'

  // Derive the displayed exercise name from current state or next info
  const exerciseName = isUpcoming
    ? (nextInfo?.nextExerciseName ?? (nextInfo === null ? 'Workout Complete!' : 'Exercise'))
    : currentExercise?.name ?? 'Exercise'

  const setLabel = isUpcoming && nextInfo
    ? nextInfo.nextSetLabel
    : `Set ${currentSetIndex + 1} / ${workout?.sets.length ?? 0}`

  const repLabel = isUpcoming && nextInfo
    ? nextInfo.nextRepLabel
    : `Rep ${currentRepeat} / ${currentSet?.repeatCount ?? 1}`

  const exerciseLabel = isUpcoming && nextInfo
    ? nextInfo.nextExerciseLabel
    : `Exercise ${currentExerciseIndex + 1} / ${currentSet?.exercises.length ?? 0}`

  // Next up label shown below the timer (not shown during rest/restBetweenSets phases)
  let nextUpText: string
  if (!workout) {
    nextUpText = 'Next: --'
  } else if (phase === 'idle') {
    nextUpText = 'Next: Start when ready'
  } else if (phase === 'complete') {
    nextUpText = 'Next: Session complete'
  } else if (!currentSet) {
    nextUpText = 'Next: --'
  } else if (nextInfo?.nextExerciseName) {
    nextUpText = `Next: ${nextInfo.nextExerciseName}`
  } else if (nextInfo?.phase === 'complete') {
    nextUpText = 'Next: Finish'
  } else {
    nextUpText = 'Next: --'
  }

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
              {isUpcoming && phase !== 'restBetweenSets'
                ? `Up Next: ${exerciseName}`
                : exerciseName}
            </p>

            {currentSet && (
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/70 mb-6">
                <span className="px-3 py-1 rounded-full border border-white/20">
                  {setLabel}
                </span>
                {repLabel && (
                  <span className="px-3 py-1 rounded-full border border-white/20">
                    {repLabel}
                  </span>
                )}
                {exerciseLabel && (
                  <span className="px-3 py-1 rounded-full border border-white/20">
                    {exerciseLabel}
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
                  <span>{nextUpText}</span>
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
