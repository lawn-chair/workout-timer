import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/lib/timer/store'
import { audioManager } from './audio'
import { TimerPhase } from './types'

export function useTimerAudio() {
  const { phase, timeRemaining, isRunning } = useTimerStore()
  const prevPhaseRef = useRef<TimerPhase>('idle')
  const prevTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isRunning) return

    if (phase !== prevPhaseRef.current) {
      switch (phase) {
        case 'countdown':
          audioManager.playCountdown()
          break
        case 'work':
          audioManager.playWorkStart()
          break
        case 'rest':
        case 'restBetweenSets':
          audioManager.playRestStart()
          break
        case 'complete':
          audioManager.playComplete()
          break
      }
      prevPhaseRef.current = phase
    }

    if (
      timeRemaining <= 3 &&
      timeRemaining > 0 &&
      timeRemaining !== prevTimeRef.current
    ) {
      audioManager.playCountdown()
    }

    prevTimeRef.current = timeRemaining
  }, [phase, timeRemaining, isRunning])
}
