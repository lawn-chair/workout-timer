import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { useTimerAudio } from './useTimerAudio'
import { useTimerStore } from './store'
import { Workout } from './types'
import React from 'react'

type ExerciseInput = { name?: string; workDuration?: number }
type SetInput = {
  repeatCount?: number
  restBetweenExercises?: number
  restBetweenRepeats?: number
  restBetweenSets?: number
  exercises?: ExerciseInput[]
}

const createWorkout = (sets: SetInput[]): Workout => ({
  id: '1',
  name: 'Test Workout',
  sets: sets.map((set, setIndex) => ({
    id: String(setIndex + 1),
    order: setIndex,
    repeatCount: set.repeatCount ?? 1,
    restBetweenExercises: set.restBetweenExercises ?? 0,
    restBetweenRepeats: set.restBetweenRepeats ?? 0,
    restBetweenSets: set.restBetweenSets ?? 0,
    exercises: (set.exercises ?? [{ workDuration: 30 }]).map((ex, exIndex) => ({
      id: `${setIndex + 1}-${exIndex + 1}`,
      name: ex.name || `Exercise ${exIndex + 1}`,
      workDuration: ex.workDuration ?? 30,
      order: exIndex,
    })),
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

function TestComponent({
  prefs,
}: { prefs?: Parameters<typeof useTimerAudio>[0] } = {}) {
  useTimerAudio(prefs)
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
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  })

  it('should play countdown audio when phase changes to countdown', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    render(<TestComponent />)

    expect(audioManager.playCountdown).toHaveBeenCalled()
  })

  it('should play work start audio when phase changes to work', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
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
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'rest', timeRemaining: 10 })

    render(<TestComponent />)

    expect(audioManager.playRestStart).toHaveBeenCalled()
  })

  it('should play rest start audio when phase changes to restBetweenSets', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 30,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'restBetweenSets', timeRemaining: 30 })

    render(<TestComponent />)

    expect(audioManager.playRestStart).toHaveBeenCalled()
  })

  it('should play countdown beep when time is <= 3 and > 0', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 3, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).toHaveBeenCalled()
  })

  it('should not play countdown beep when time is 0', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 0, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })

  it('should not play countdown beep when time is > 3', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'work', timeRemaining: 4, isRunning: true })

    render(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })

  it('should not play countdown when countdownBeeps is false', () => {
    const workout = createWorkout([
      { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    render(
      <TestComponent
        prefs={{
          countdownBeeps: false,
          workStartSound: true,
          restStartSound: true,
          completionChime: true,
        }}
      />
    )

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })

  it('should not play work start when workStartSound is false', () => {
    const workout = createWorkout([
      { exercises: [{ name: 'Push-ups', workDuration: 30 }] },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      isRunning: true,
    })

    render(
      <TestComponent
        prefs={{
          countdownBeeps: true,
          workStartSound: false,
          restStartSound: true,
          completionChime: true,
        }}
      />
    )

    expect(audioManager.playWorkStart).not.toHaveBeenCalled()
  })

  it('should play work start again on each exercise within a group even though phase stays work', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [
          { name: 'Push-ups', workDuration: 30 },
          { name: 'Squats', workDuration: 30 },
          { name: 'Lunges', workDuration: 30 },
        ],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.setState({
      phase: 'work',
      currentExerciseIndex: 0,
      timeRemaining: 30,
      isRunning: true,
    })

    const { rerender } = render(<TestComponent />)
    expect(audioManager.playWorkStart).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()

    // Back-to-back exercise: phase stays 'work', only the index changes.
    useTimerStore.setState({ currentExerciseIndex: 1, timeRemaining: 30 })
    rerender(<TestComponent />)
    expect(audioManager.playWorkStart).toHaveBeenCalledTimes(1)

    vi.clearAllMocks()

    useTimerStore.setState({ currentExerciseIndex: 2, timeRemaining: 30 })
    rerender(<TestComponent />)
    expect(audioManager.playWorkStart).toHaveBeenCalledTimes(1)
  })

  it('should only play phase change audio once on subsequent renders', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    const { rerender } = render(<TestComponent />)

    vi.clearAllMocks()

    rerender(<TestComponent />)

    expect(audioManager.playCountdown).not.toHaveBeenCalled()
  })
})
