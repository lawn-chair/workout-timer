import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const createAudioContextMock = (state: 'running' | 'suspended') => ({
  state,
  sampleRate: 44100,
  resume: vi.fn().mockResolvedValue(undefined),
  createBuffer: vi.fn(() => ({})),
  createBufferSource: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    buffer: null,
  })),
  createOscillator: vi.fn(() => ({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 0 },
    type: 'sine',
  })),
  createGain: vi.fn(() => ({
    connect: vi.fn(),
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
  })),
  destination: {},
  currentTime: 0,
})

describe('audioManager coverage', () => {
  const originalAudioContext = globalThis.AudioContext

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.AudioContext = originalAudioContext
  })

  it('plays beeps when audio context is running', async () => {
    const ctx = createAudioContextMock('running')
    globalThis.AudioContext = class {
      state = ctx.state
      sampleRate = ctx.sampleRate
      resume = ctx.resume
      createBuffer = ctx.createBuffer
      createBufferSource = ctx.createBufferSource
      createOscillator = ctx.createOscillator
      createGain = ctx.createGain
      destination = ctx.destination
      currentTime = ctx.currentTime
    } as unknown as typeof AudioContext

    vi.resetModules()
    const { audioManager } = await import('./audio')
    audioManager.setEnabled(true)

    audioManager.playBeep(900, 0.2)

    expect(ctx.createOscillator).toHaveBeenCalled()
    expect(ctx.createGain).toHaveBeenCalled()
  })

  it('skips playback when disabled', async () => {
    const ctx = createAudioContextMock('running')
    globalThis.AudioContext = class {
      state = ctx.state
      sampleRate = ctx.sampleRate
      resume = ctx.resume
      createBuffer = ctx.createBuffer
      createBufferSource = ctx.createBufferSource
      createOscillator = ctx.createOscillator
      createGain = ctx.createGain
      destination = ctx.destination
      currentTime = ctx.currentTime
    } as unknown as typeof AudioContext

    vi.resetModules()
    const { audioManager } = await import('./audio')
    audioManager.setEnabled(false)

    audioManager.playBeep(900, 0.2)
    audioManager.unlock()

    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('resumes and skips playback when suspended', async () => {
    const ctx = createAudioContextMock('suspended')
    globalThis.AudioContext = class {
      state = ctx.state
      sampleRate = ctx.sampleRate
      resume = ctx.resume
      createBuffer = ctx.createBuffer
      createBufferSource = ctx.createBufferSource
      createOscillator = ctx.createOscillator
      createGain = ctx.createGain
      destination = ctx.destination
      currentTime = ctx.currentTime
    } as unknown as typeof AudioContext

    vi.resetModules()
    const { audioManager } = await import('./audio')
    audioManager.setEnabled(true)

    audioManager.playBeep(900, 0.2)

    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.createOscillator).not.toHaveBeenCalled()
  })

  it('handles audio context errors without throwing', async () => {
    globalThis.AudioContext = class {
      state = 'running'
      resume = vi.fn().mockResolvedValue(undefined)
      createOscillator = () => {
        throw new Error('boom')
      }
      createGain = vi.fn(() => ({
        connect: vi.fn(),
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
      }))
      destination = {}
      currentTime = 0
    } as unknown as typeof AudioContext

    vi.resetModules()
    const { audioManager } = await import('./audio')
    audioManager.setEnabled(true)

    expect(() => audioManager.playBeep(900, 0.2)).not.toThrow()
  })

  it('unlocks audio when suspended', async () => {
    const ctx = createAudioContextMock('suspended')
    globalThis.AudioContext = class {
      state = ctx.state
      sampleRate = ctx.sampleRate
      resume = ctx.resume
      createBuffer = ctx.createBuffer
      createBufferSource = ctx.createBufferSource
      createOscillator = ctx.createOscillator
      createGain = ctx.createGain
      destination = ctx.destination
      currentTime = ctx.currentTime
    } as unknown as typeof AudioContext

    vi.resetModules()
    const { audioManager } = await import('./audio')
    audioManager.setEnabled(true)

    audioManager.unlock()

    expect(ctx.resume).toHaveBeenCalled()
    expect(ctx.createBufferSource).toHaveBeenCalled()
  })
})
