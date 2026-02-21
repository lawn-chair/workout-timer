import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

type WakeLockSentinelMock = {
  released: boolean
  release: () => Promise<void>
}

function createWakeLockMock() {
  const sentinel: WakeLockSentinelMock = {
    released: false,
    release: vi.fn(async () => {
      sentinel.released = true
    }),
  }

  const request = vi.fn(async () => sentinel as unknown as WakeLockSentinel)

  return { request, sentinel }
}

describe('useWakeLock', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('requests wake lock when active and releases when inactive', async () => {
    const { request, sentinel } = createWakeLockMock()

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
    })

    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    })

    expect(request).toHaveBeenCalledWith('screen')

    await act(async () => {
      rerender({ active: false })
    })

    expect(sentinel.release).toHaveBeenCalled()
  })

  it('re-requests wake lock on visibility change when active', async () => {
    const { request } = createWakeLockMock()

    Object.defineProperty(navigator, 'wakeLock', {
      value: { request },
      configurable: true,
    })

    renderHook(() => useWakeLock(true))

    expect(request).toHaveBeenCalledTimes(1)

    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      configurable: true,
    })

    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(request).toHaveBeenCalledTimes(2)
  })
})
