import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useTimer } from './useTimer'
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
      currentExerciseIndex: 0,
      currentSet: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should not start interval when not running', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)

    render(<TestComponent />)

    expect(screen.getByTestId('phase').textContent).toBe('idle')
  })

  it('should start interval when running in countdown phase', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    render(<TestComponent />)

    expect(screen.getByTestId('phase').textContent).toBe('countdown')
    expect(screen.getByTestId('running').textContent).toBe('true')
  })

  it('should tick when running in work phase', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      isRunning: true,
    })

    render(<TestComponent />)

    vi.advanceTimersByTime(1000)

    const state = useTimerStore.getState()
    expect(state.timeRemaining).toBe(29)
  })

  it('should not tick when phase is idle', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)

    render(<TestComponent />)

    const timeBefore = screen.getByTestId('time').textContent
    vi.advanceTimersByTime(2000)

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })

  it('should not tick when phase is complete', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()
    useTimerStore.setState({ phase: 'complete', isRunning: false })

    render(<TestComponent />)

    const timeBefore = screen.getByTestId('time').textContent
    vi.advanceTimersByTime(2000)

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })

  it('should clear interval on unmount', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    const { unmount } = render(<TestComponent />)

    unmount()

    vi.advanceTimersByTime(5000)

    expect(useTimerStore.getState().totalTimeElapsed).toBe(0)
  })

  it('should handle pause correctly', () => {
    const workout = createWorkout([{ name: 'Push-ups', workDuration: 30 }])
    useTimerStore.getState().loadWorkout(workout)
    useTimerStore.getState().start()

    render(<TestComponent />)

    const timeBefore = screen.getByTestId('time').textContent
    useTimerStore.getState().pause()

    vi.advanceTimersByTime(3000)

    expect(screen.getByTestId('time').textContent).toBe(timeBefore)
  })
})
