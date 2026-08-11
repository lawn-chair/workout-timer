import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { useTimer } from './useTimer'
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

function TestComponent() {
  useTimer()
  const { phase, isRunning, timeRemaining } = useTimerStore()
  return (
    <div>
      <span data-testid="phase">{phase}</span>
      <span data-testid="running">{isRunning.toString()}</span>
      <span data-testid="time">{timeRemaining}</span>
    </div>
  )
}

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
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

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not start interval when not running', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)

    render(<TestComponent />)

    expect(screen.getByTestId('phase').textContent).toBe('idle')
  })

  it('should start interval when running in countdown phase', () => {
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

    expect(screen.getByTestId('phase').textContent).toBe('countdown')
    expect(screen.getByTestId('running').textContent).toBe('true')
  })

  it('should tick when running in work phase', () => {
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
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      isRunning: true,
    })

    render(<TestComponent />)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    const state = useTimerStore.getState()
    expect(state.timeRemaining).toBe(29)
  })

  it('should not tick when phase is idle', () => {
    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 30 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)

    render(<TestComponent />)

    const timeBefore = screen.getByTestId('time').textContent
    vi.advanceTimersByTime(2000)

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })

  it('should not tick when phase is complete', () => {
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
    useTimerStore.setState({ phase: 'complete', isRunning: false })

    render(<TestComponent />)

    const timeBefore = screen.getByTestId('time').textContent
    vi.advanceTimersByTime(2000)

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })

  it('should clear interval on unmount', () => {
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

    const { unmount } = render(<TestComponent />)

    unmount()

    vi.advanceTimersByTime(5000)

    expect(useTimerStore.getState().totalTimeElapsed).toBe(0)
  })

  it('should handle pause correctly', () => {
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

    const timeBefore = screen.getByTestId('time').textContent
    act(() => {
      useTimerStore.getState().pause()
    })

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })

  it('fires multiple ticks to catch up after elapsed time', () => {
    let dateNow = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => dateNow)

    const workout = createWorkout([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Push-ups', workDuration: 10 }],
      },
    ])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 10,
      isRunning: true,
    })

    render(<TestComponent />)

    // Simulate 3 seconds passing before the interval fires
    dateNow += 3000
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    // Should have fired 3 ticks (floor(3000/1000) = 3)
    expect(useTimerStore.getState().timeRemaining).toBe(7)

    vi.restoreAllMocks()
  })
})
