import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import TimerDisplay from './TimerDisplay'
import { useTimerStore } from '@/lib/timer/store'

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

describe('TimerDisplay', () => {
  beforeEach(() => {
    resetTimerState()
  })

  it('shows wake lock notice when requested', () => {
    render(<TimerDisplay showWakeLockNotice={true} />)

    expect(
      screen.getByText("Keep screen awake isn't supported on this device.")
    ).toBeInTheDocument()
  })

  it('shows complete state copy', () => {
    useTimerStore.setState({ phase: 'complete' })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Workout Complete!')).toBeInTheDocument()
  })

  it('shows next up label for idle phase', () => {
    useTimerStore.setState({
      phase: 'idle',
      timeRemaining: 90,
      totalTimeElapsed: 0,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: Start when ready')).toBeInTheDocument()
  })

  it('shows placeholder when workout missing', () => {
    useTimerStore.setState({ workout: null, phase: 'idle' })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: --')).toBeInTheDocument()
  })

  it('shows placeholder when set missing', () => {
    useTimerStore.setState({
      workout: { id: 'workout-1', name: 'Workout', sets: [] },
      phase: 'work',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: --')).toBeInTheDocument()
  })

  it('shows next up label for work phase', () => {
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [
              { id: 'ex-1', name: 'Push-ups', workDuration: 30 },
              { id: 'ex-2', name: 'Squats', workDuration: 30 },
            ],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: Squats')).toBeInTheDocument()
  })

  it('shows next set label when moving to next set', () => {
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
          {
            id: 'set-2',
            order: 1,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-2', name: 'Squats', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: Set 2')).toBeInTheDocument()
  })

  it('shows repeat next label when more repeats remain', () => {
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 2,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: Push-ups')).toBeInTheDocument()
  })

  it('shows next exercise placeholder during rest when missing', () => {
    useTimerStore.setState({
      phase: 'rest',
      timeRemaining: 10,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 10,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Up Next: Workout Complete!')).toBeInTheDocument()
  })

  it('shows finish next label on last exercise and set', () => {
    useTimerStore.setState({
      phase: 'work',
      timeRemaining: 30,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Next: Finish')).toBeInTheDocument()
  })

  it('shows next exercise during rest', () => {
    useTimerStore.setState({
      phase: 'rest',
      timeRemaining: 10,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 10,
            restBetweenSets: 0,
            exercises: [
              { id: 'ex-1', name: 'Push-ups', workDuration: 30 },
              { id: 'ex-2', name: 'Squats', workDuration: 30 },
            ],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Up Next: Squats')).toBeInTheDocument()
  })

  it('shows next up label for rest between sets', () => {
    useTimerStore.setState({
      phase: 'restBetweenSets',
      timeRemaining: 10,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 10,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
          {
            id: 'set-2',
            order: 1,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-2', name: 'Squats', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Squats')).toBeInTheDocument()
  })

  it('shows repeat message during rest when moving to next repeat', () => {
    useTimerStore.setState({
      phase: 'rest',
      timeRemaining: 10,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 2,
            restBetweenExercises: 10,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Up Next: Push-ups')).toBeInTheDocument()
  })

  it('shows next set first exercise during rest when moving to next set', () => {
    useTimerStore.setState({
      phase: 'rest',
      timeRemaining: 10,
      totalTimeElapsed: 0,
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      workout: {
        id: 'workout-1',
        name: 'Workout',
        sets: [
          {
            id: 'set-1',
            order: 0,
            repeatCount: 1,
            restBetweenExercises: 10,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-1', name: 'Push-ups', workDuration: 30 }],
          },
          {
            id: 'set-2',
            order: 1,
            repeatCount: 1,
            restBetweenExercises: 0,
            restBetweenSets: 0,
            exercises: [{ id: 'ex-2', name: 'Squats', workDuration: 30 }],
          },
        ],
      },
    })

    render(<TimerDisplay showWakeLockNotice={false} />)

    expect(screen.getByText('Up Next: Squats')).toBeInTheDocument()
  })
})
