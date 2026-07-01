import { useTimerStore } from '@/lib/timer/store'
import { audioManager } from '@/lib/timer/audio'

export default function TimerControls() {
  const { phase, isRunning, start, pause, resume, skip, stop } = useTimerStore()

  const handleStart = () => {
    audioManager.unlock()
    start()
  }

  const handleResume = () => {
    audioManager.unlock()
    resume()
  }

  const handleStop = () => {
    if (!confirm('Stop this workout? Your progress will be lost.')) return
    stop()
  }

  if (phase === 'complete') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/40 backdrop-blur-md p-4">
      <div className="flex items-center justify-center gap-4">
        {phase === 'idle' ? (
          <button
            onClick={handleStart}
            className="lime-button w-40 h-16 rounded-full text-sm uppercase tracking-[0.2em]"
            data-testid="timer-start-button"
          >
            Start
          </button>
        ) : (
          <>
            <button
              onClick={handleStop}
              className="w-16 h-16 rounded-full bg-white/10 text-white text-xs uppercase tracking-[0.2em]"
              data-testid="timer-stop-button"
            >
              Stop
            </button>

            <button
              onClick={isRunning ? pause : handleResume}
              className="w-20 h-20 rounded-full bg-white text-gray-900 text-2xl font-bold"
              data-testid="timer-pause-button"
            >
              {isRunning ? '⏸' : '▶'}
            </button>

            <button
              onClick={skip}
              className="w-16 h-16 rounded-full bg-white/10 text-white text-xs uppercase tracking-[0.2em]"
              data-testid="timer-skip-button"
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  )
}
