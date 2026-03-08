import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/lib/timer/store'
import { audioManager } from './audio'
import { TimerPhase } from './types'

export interface AudioPreferences {
  countdownBeeps: boolean
  workStartSound: boolean
  restStartSound: boolean
  completionChime: boolean
}

const defaultPrefs: AudioPreferences = {
  countdownBeeps: true,
  workStartSound: true,
  restStartSound: true,
  completionChime: true,
}

export function useTimerAudio(prefs: AudioPreferences = defaultPrefs) {
  const { phase, timeRemaining, isRunning } = useTimerStore()
  const prevPhaseRef = useRef<TimerPhase>('idle')
  const prevTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isRunning) return

    if (phase !== prevPhaseRef.current) {
      switch (phase) {
        case 'countdown':
          if (prefs.countdownBeeps) audioManager.playCountdown()
          break
        case 'work':
          if (prefs.workStartSound) audioManager.playWorkStart()
          break
        case 'rest':
        case 'restBetweenSets':
          if (prefs.restStartSound) audioManager.playRestStart()
          break
        case 'complete':
          if (prefs.completionChime) audioManager.playComplete()
          break
      }
      prevPhaseRef.current = phase
    }

    if (
      prefs.countdownBeeps &&
      timeRemaining <= 3 &&
      timeRemaining > 0 &&
      timeRemaining !== prevTimeRef.current
    ) {
      audioManager.playCountdown()
    }

    prevTimeRef.current = timeRemaining
  }, [phase, timeRemaining, isRunning, prefs])
}
