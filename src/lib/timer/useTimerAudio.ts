import { useEffect, useRef } from 'react'
import { useTimerStore } from '@/lib/timer/store'
import { audioManager } from './audio'

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
  const {
    phase,
    timeRemaining,
    isRunning,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat,
  } = useTimerStore()
  const prevStepKeyRef = useRef<string>('idle')
  const prevTimeRef = useRef<number>(0)

  useEffect(() => {
    if (!isRunning) return

    // Keyed on phase + position, not just phase, so back-to-back exercises
    // within a set (phase stays 'work' when restBetweenExercises is 0) still
    // retrigger the work-start cue for each new exercise.
    const stepKey = `${phase}-${currentSetIndex}-${currentExerciseIndex}-${currentRepeat}`
    if (stepKey !== prevStepKeyRef.current) {
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
      prevStepKeyRef.current = stepKey
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
  }, [
    phase,
    timeRemaining,
    isRunning,
    currentSetIndex,
    currentExerciseIndex,
    currentRepeat,
    prefs,
  ])
}
