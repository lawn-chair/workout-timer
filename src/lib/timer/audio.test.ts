import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { audioManager } from './audio'

beforeEach(() => {
  vi.useFakeTimers()
  audioManager.setEnabled(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

describe('audioManager', () => {
  describe('setEnabled', () => {
    it('should enable audio', () => {
      audioManager.setEnabled(true)
    })

    it('should disable audio', () => {
      audioManager.setEnabled(false)
    })
  })

  describe('playCountdown', () => {
    it('should call playBeep with default parameters', () => {
      const playBeepSpy = vi.spyOn(audioManager, 'playBeep')
      audioManager.playCountdown()
      expect(playBeepSpy).toHaveBeenCalledWith(800, 0.1)
    })
  })

  describe('playWorkStart', () => {
    it('should play two beeps with increasing frequency', () => {
      const playBeepSpy = vi.spyOn(audioManager, 'playBeep')
      audioManager.playWorkStart()
      expect(playBeepSpy).toHaveBeenCalledWith(1000, 0.3)
      vi.advanceTimersByTime(200)
      expect(playBeepSpy).toHaveBeenCalledWith(1200, 0.3)
    })
  })

  describe('playRestStart', () => {
    it('should play two beeps with decreasing frequency', () => {
      const playBeepSpy = vi.spyOn(audioManager, 'playBeep')
      audioManager.playRestStart()
      expect(playBeepSpy).toHaveBeenCalledWith(600, 0.3)
      vi.advanceTimersByTime(200)
      expect(playBeepSpy).toHaveBeenCalledWith(400, 0.3)
    })
  })

  describe('playComplete', () => {
    it('should play three beeps with increasing frequency', () => {
      const playBeepSpy = vi.spyOn(audioManager, 'playBeep')
      audioManager.playComplete()
      expect(playBeepSpy).toHaveBeenCalledWith(800, 0.2)
      vi.advanceTimersByTime(250)
      expect(playBeepSpy).toHaveBeenCalledWith(1000, 0.2)
      vi.advanceTimersByTime(250)
      expect(playBeepSpy).toHaveBeenCalledWith(1200, 0.4)
    })
  })

  describe('unlock', () => {
    it('should resume audio context when suspended', () => {
      const resume = vi.fn().mockResolvedValue(undefined)

      class AudioContextMock {
        state = 'suspended'
        sampleRate = 44100
        resume = resume
        createBuffer = vi.fn(() => ({}))
        createBufferSource = vi.fn(() => ({
          connect: vi.fn(),
          start: vi.fn(),
          buffer: null,
        }))
        destination = {}
        currentTime = 0
      }

      const originalAudioContext = globalThis.AudioContext
      globalThis.AudioContext =
        AudioContextMock as unknown as typeof AudioContext

      audioManager.unlock()

      expect(resume).toHaveBeenCalled()

      globalThis.AudioContext = originalAudioContext
    })
  })
})
