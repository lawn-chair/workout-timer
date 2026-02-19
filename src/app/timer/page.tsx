'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TimerDisplay from '@/components/timer/TimerDisplay'
import TimerControls from '@/components/timer/TimerControls'
import { useTimerStore } from '@/lib/timer/store'
import { useTimer } from '@/lib/timer/useTimer'
import { useTimerAudio } from '@/lib/timer/useTimerAudio'

export default function TimerPage() {
  const router = useRouter()
  const { phase, workout } = useTimerStore()

  useTimer()
  useTimerAudio()

  useEffect(() => {
    if (!workout) {
      router.push('/')
    }
  }, [workout, router])

  if (!workout) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const handleComplete = () => {
    router.push('/')
  }

  if (phase === 'complete') {
    return (
      <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center text-white p-4">
        <h1 className="text-6xl font-bold mb-4">Workout Complete!</h1>
        <p className="text-2xl mb-8">Great job!</p>
        <button
          onClick={handleComplete}
          className="bg-white text-blue-500 px-8 py-4 rounded-lg text-xl font-bold"
        >
          Back to Workouts
        </button>
      </div>
    )
  }

  return (
    <>
      <TimerDisplay />
      <TimerControls />
    </>
  )
}
