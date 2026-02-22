import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ServiceWorkerRegister from './ServiceWorkerRegister'

type ReadyState = 'loading' | 'interactive' | 'complete'

const setReadyState = (state: ReadyState) => {
  Object.defineProperty(document, 'readyState', {
    value: state,
    configurable: true,
  })
}

describe('ServiceWorkerRegister', () => {
  const originalServiceWorker = navigator.serviceWorker
  const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
  const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

  beforeEach(() => {
    addEventListenerSpy.mockClear()
    removeEventListenerSpy.mockClear()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      configurable: true,
    })
    setReadyState('complete')
  })

  it('does nothing when service workers are unsupported', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      configurable: true,
    })
    Reflect.deleteProperty(navigator, 'serviceWorker')

    render(<ServiceWorkerRegister />)

    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('registers immediately when document is complete', async () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    })
    setReadyState('complete')

    render(<ServiceWorkerRegister />)

    expect(register).toHaveBeenCalledWith('/sw.js')
    expect(addEventListenerSpy).not.toHaveBeenCalled()
  })

  it('registers on window load when document is not complete', () => {
    const register = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    })
    setReadyState('loading')

    const { unmount } = render(<ServiceWorkerRegister />)

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    )
    const handler = addEventListenerSpy.mock.calls[0]?.[1] as
      | (() => void)
      | undefined

    handler?.()
    expect(register).toHaveBeenCalledWith('/sw.js')

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'load',
      expect.any(Function)
    )
  })
})
