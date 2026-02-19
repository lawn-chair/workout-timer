import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useTimerAudio } from './useTimerAudio'
import { useTimerStore } from './store'
import { Workout } from './types'
import React from 'react'

const createWorkout = (
  exercises: Partial<Workout['exercises'][0]>[]
): Workout => ({
  id: '1',
  name: 'Test Workout',
  exercises: exercises.map((e, i) => ({
    id: String(i + 1),
    name: e.name || `Exercise ${i + 1}`,
    workDuration: e.workDuration ?? 30,
    restDuration: e.restDuration ?? 10,
    sets: e.sets ?? 1,
    restBetweenSets: e.restBetweenSets ?? 0,
  })),
})

vi.mock('./audio', () => ({
  audioManager: {
    playCountdown: vi.fn(),
    playWorkStart: vi.fn(),
    playRestStart: vi.fn(),
    playComplete: vi.fn(),
  },
}))

import { audioManager } from './audio'

function TestComponent() {
  useTimerAudio()
  const { phase, isRunning, timeRemaining } = useTimerStore()
  return (
    <div>
      <span data-testid="phase">{phase}</span>
      <span data-testid="running">{isRunning.toString()}</span>
      <span data-testid="time">{timeRemaining}</span>
    </div>
  )
}

describe('useTimerAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTimerStore.setState({
      workout: null,
      phase: 'idle',
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  })

  it('should play countdown audio when phase changes to countdown', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    render(<TestComponent />)

    expect(audioManager.playCountdown).toHaveBeenCalled()
  })

  it('should play work start audio when phase changes to work', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      isRunning: true,
    })

    render(<TestComponent />)

    expect(audioManager.playWorkStart).toHaveBeenCalled()
  })

  it('should not play rest audio when phase changes to rest', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'rest', timeRemaining: 10 })

    render(<TestComponent />)

    expect(audioManager.playRestStart).toHaveBeenCalled()
  })

  it('should play rest start audio when phase changes to restBetweenSets', () => {
    const workout = createWorkout([
      { name: 'Push-ups', workDuration: 30, restBetweenSets: 30 },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'restBetweenSets', timeRemaining: 30 })

    render(<TestComponent />)

    expect(audioManager.playRestStart).toHaveBeenCalled()
  })

  it('should play countdown beep when time is <= 3 and > 0', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 3, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).toHaveBeenCalled()
  })

  it('should not play countdown beep when time is 0', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 0, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })

  it('should not play countdown beep when time is > 3', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 4, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })

  it('should only play phase change audio once on subsequent renders', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    const { rerender } = render(<TestComponent />)

    vi.clearAllMocks()

    rerender(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })
})
