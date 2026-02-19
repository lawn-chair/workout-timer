import { useTimerStore } from '@/lib/timer/store'

export default function TimerControls() {
  const { phase, isRunning, pause, resume, skip, stop } = useTimerStore()

  if (phase === 'idle' || phase === 'complete') return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm p-4">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={stop}
          className="w-16 h-16 rounded-full bg-white/20 text-white text-xl font-medium hover:bg-white/30 transition-colors"
        >
          Stop
        </button>

        <button
          onClick={isRunning ? pause : resume}
          className="w-20 h-20 rounded-full bg-white text-gray-900 text-2xl font-bold hover:bg-gray-100 transition-colors"
        >
          {isRunning ? '⏸' : '▶'}
        </button>

        <button
          onClick={skip}
          className="w-16 h-16 rounded-full bg-white/20 text-white text-xl font-medium hover:bg-white/30 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
