import { useEffect, useRef } from 'react'
import { useTimerStore } from './store'

export function useTimer() {
  const { tick, isRunning, phase } = useTimerStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastTickRef = useRef<number>(0)

  useEffect(() => {
    if (isRunning && phase !== 'idle' && phase !== 'complete') {
      lastTickRef.current = Date.now()

      intervalRef.current = setInterval(() => {
        const now = Date.now()
        const elapsed = now - lastTickRef.current
        const ticksToFire = Math.max(1, Math.floor(elapsed / 1000))

        for (let i = 0; i < ticksToFire; i++) {
          tick()
        }

        lastTickRef.current = now
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
