'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TimerDisplay from '@/components/timer/TimerDisplay'
import TimerControls from '@/components/timer/TimerControls'
import { useTimerStore } from '@/lib/timer/store'
import { useTimer } from '@/lib/timer/useTimer'
import { useTimerAudio } from '@/lib/timer/useTimerAudio'
import { useWakeLock } from '@/lib/timer/useWakeLock'
import AppShell from '@/components/ui/AppShell'
import StatePanel from '@/components/ui/StatePanel'

export default function TimerPage() {
  const router = useRouter()
  const { phase, workout, isRunning } = useTimerStore()

  useTimer()
  useTimerAudio()
  const { isSupported: wakeLockSupported } = useWakeLock(
    isRunning && phase !== 'idle' && phase !== 'complete'
  )

  useEffect(() => {
    if (!workout) {
      router.push('/')
    }
  }, [workout, router])

  if (!workout) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-5">
          <StatePanel
            eyebrow="Loading"
            title="Preparing the timer"
            description="Pulling your workout data."
          />
        </div>
      </AppShell>
    )
  }

  const handleComplete = () => {
    router.push('/')
  }

  if (phase === 'complete') {
    return (
      <AppShell>
        <div className="min-h-screen phase-band phase-complete flex flex-col items-center justify-center text-white p-6">
          <p className="text-xs uppercase tracking-[0.4em] text-white/80">
            Session Complete
          </p>
          <h1 className="display-font text-6xl md:text-7xl mt-4">
            Workout Complete
          </h1>
          <p className="text-lg text-white/80 mt-4">
            Great job. Hydrate and recover.
          </p>
          <button
            onClick={handleComplete}
            className="lime-button px-8 py-3 rounded-full text-sm mt-8"
          >
            Back to Workouts
          </button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <TimerDisplay showWakeLockNotice={!wakeLockSupported} />
      <TimerControls />
    </AppShell>
  )
}
