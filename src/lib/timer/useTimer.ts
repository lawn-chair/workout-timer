import { useEffect, useRef } from 'react'
import { useTimerStore } from './store'

export function useTimer() {
  const { tick, isRunning, phase } = useTimerStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'complete') {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning, phase, tick])
}
