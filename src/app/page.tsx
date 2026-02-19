'use client'

import { useEffect } from 'react'
import TimerDisplay from '@/components/timer/TimerDisplay'
import TimerControls from '@/components/timer/TimerControls'
import { useTimerStore } from '@/lib/timer/store'
import { useTimer } from '@/lib/timer/useTimer'
import { useTimerAudio } from '@/lib/timer/useTimerAudio'
import { Workout } from '@/lib/timer/types'

const sampleWorkout: Workout = {
  id: '1',
  name: 'Sample HIIT',
  description: 'A quick HIIT workout',
  exercises: [
    {
      id: '1',
      name: 'Jumping Jacks',
      workDuration: 30,
      restDuration: 10,
      sets: 3,
      restBetweenSets: 30,
    },
    {
      id: '2',
      name: 'Squats',
      workDuration: 30,
      restDuration: 10,
      sets: 3,
      restBetweenSets: 30,
    },
    {
      id: '3',
      name: 'Push-ups',
      workDuration: 30,
      restDuration: 10,
      sets: 3,
      restBetweenSets: 30,
    },
    {
      id: '4',
      name: 'Burpees',
      workDuration: 30,
      restDuration: 10,
      sets: 3,
      restBetweenSets: 0,
    },
  ],
}

export default function TimerPage() {
  const { phase, loadWorkout, start } = useTimerStore()

  useTimer()
  useTimerAudio()

  useEffect(() => {
    loadWorkout(sampleWorkout)
  }, [loadWorkout])

  if (phase === 'idle') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <h1 className="text-4xl font-bold mb-4">{sampleWorkout.name}</h1>
          <p className="text-gray-400 mb-8">{sampleWorkout.description}</p>

          <div className="space-y-2 mb-8 text-left">
            {sampleWorkout.exercises.map((ex, i) => (
              <div
                key={ex.id}
                className="bg-gray-800 rounded-lg p-3 flex justify-between items-center"
              >
                <span>
                  {i + 1}. {ex.name}
                </span>
                <span className="text-gray-400 text-sm">
                  {ex.sets} × {ex.workDuration}s work / {ex.restDuration}s rest
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={start}
            className="w-full py-4 bg-green-500 hover:bg-green-600 text-white text-xl font-bold rounded-lg transition-colors"
          >
            Start Workout
          </button>
        </div>
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
