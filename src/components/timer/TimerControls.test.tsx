import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import TimerControls from './TimerControls'
import { useTimerStore } from '@/lib/timer/store'

vi.mock('@/lib/timer/audio', () => ({
  audioManager: {
    unlock: vi.fn(),
  },
}))

import { audioManager } from '@/lib/timer/audio'

const resetTimerState = () => {
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
}

describe('TimerControls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTimerState()
  })

  it('starts the timer and unlocks audio', () => {
    const startSpy = vi.spyOn(useTimerStore.getState(), 'start')

    render(<TimerControls />)

    fireEvent.click(screen.getByTestId('timer-start-button'))

    expect(audioManager.unlock).toHaveBeenCalled()
    expect(startSpy).toHaveBeenCalled()
  })

  it('renders pause/stop/skip controls when running', () => {
    useTimerStore.setState({ phase: 'work', isRunning: true })

    render(<TimerControls />)

    expect(screen.getByTestId('timer-stop-button')).toBeInTheDocument()
    expect(screen.getByTestId('timer-pause-button')).toBeInTheDocument()
    expect(screen.getByTestId('timer-skip-button')).toBeInTheDocument()
  })

  it('toggles pause and resume', () => {
    useTimerStore.setState({ phase: 'work', isRunning: true })
    const pauseSpy = vi.spyOn(useTimerStore.getState(), 'pause')
    const resumeSpy = vi.spyOn(useTimerStore.getState(), 'resume')

    render(<TimerControls />)

    fireEvent.click(screen.getByTestId('timer-pause-button'))
    expect(pauseSpy).toHaveBeenCalled()

    act(() => {
      useTimerStore.setState({ isRunning: false })
    })
    fireEvent.click(screen.getByTestId('timer-pause-button'))
    expect(resumeSpy).toHaveBeenCalled()
  })
})
