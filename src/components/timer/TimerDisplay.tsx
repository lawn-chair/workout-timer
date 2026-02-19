import { useTimerStore } from '@/lib/timer/store'
import { TimerPhase } from '@/lib/timer/types'

const phaseColors: Record<TimerPhase, string> = {
  idle: 'bg-gray-900',
  countdown: 'bg-yellow-500',
  work: 'bg-green-500',
  rest: 'bg-red-500',
  restBetweenSets: 'bg-orange-500',
  complete: 'bg-blue-500',
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

export default function TimerDisplay() {
  const {
    phase,
    timeRemaining,
    workout,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat,
  } = useTimerStore()

  const currentSet = workout?.sets[currentSetIndex]
  const currentExercise = currentSet?.exercises[currentExerciseIndex]

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${phaseColors[phase]} transition-colors duration-500`}
      data-testid="timer-display"
    >
      <div className="text-center text-white">
        {phase === 'complete' ? (
          <div>
            <h1 className="text-6xl font-bold mb-4">Workout Complete!</h1>
            <p className="text-2xl">Great job!</p>
          </div>
        ) : (
          <>
            <p
              className="text-2xl font-medium mb-4 opacity-90"
              data-testid="timer-phase"
            >
              {phaseLabels[phase]}
            </p>

            <p className="text-4xl font-medium mb-2 opacity-90">
              {currentExercise?.name || 'Exercise'}
            </p>

            {currentSet && currentExercise && (
              <p className="text-xl mb-8 opacity-75">
                Set {currentSetIndex + 1} of {workout?.sets.length || 0} · Rep{' '}
                {currentRepeat} of {currentSet.repeatCount} · Exercise{' '}
                {currentExerciseIndex + 1} of {currentSet.exercises.length}
              </p>
            )}

            <p className="text-[12rem] font-bold leading-none tabular-nums">
              {formatTime(timeRemaining)}
            </p>
          </>
        )}
      </div>
    </div>
  )
}
