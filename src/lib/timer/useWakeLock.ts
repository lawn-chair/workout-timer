import { useCallback, useEffect, useRef, useState } from 'react'

type WakeLockRequest = (type: 'screen') => Promise<WakeLockSentinel>

function hasWakeLock(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

export function useWakeLock(isActive: boolean) {
  const [isSupported, setIsSupported] = useState(hasWakeLock())
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  const releaseWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release()
      } catch {
        // Ignore release errors
      } finally {
        sentinelRef.current = null
      }
    }
  }, [])

  const requestWakeLock = useCallback(async () => {
    if (!hasWakeLock()) {
      setIsSupported(false)
      return
    }

    try {
      const request = (navigator.wakeLock.request as WakeLockRequest).bind(
        navigator.wakeLock
      )
      const sentinel = await request('screen')
      sentinelRef.current = sentinel
      setIsSupported(true)
    } catch {
      // Ignore request errors
    }
  }, [])

  useEffect(() => {
    if (isActive) {
      void requestWakeLock()
    } else {
      void releaseWakeLock()
    }

    return () => {
      void releaseWakeLock()
    }
  }, [isActive, releaseWakeLock, requestWakeLock])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        void requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isActive, requestWakeLock])

  return { isSupported }
}
