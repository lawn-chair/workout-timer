import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EditWorkoutForm from './EditWorkoutForm'
import type { WorkoutSet } from '@/lib/workout/types'

const push = vi.fn()
const mutateAsync = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('@/lib/workout/queries', () => ({
  useUpdateWorkout: (id: string) => {
    updateWorkoutId = id
    return { mutateAsync }
  },
}))

// The set builder has its own test suite; stub it so these tests focus on
// how the form assembles and submits data.
vi.mock('@/components/workout/WorkoutBuilderSets', () => ({
  default: () => <div data-testid="builder-stub" />,
}))

let updateWorkoutId: string | undefined

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 's1',
    order: 0,
    repeatCount: 2,
    restBetweenExercises: 10,
    restBetweenRepeats: 20,
    restBetweenSets: 30,
    exercises: [{ id: 'e1', name: 'Burpees', workDuration: 40, order: 0 }],
    ...overrides,
  }
}

function makeWorkout(overrides: Record<string, unknown> = {}) {
  return {
    id: 'w1',
    name: 'Leg Day',
    description: 'Lower body',
    tags: ['strength', 'legs'],
    isPublic: false,
    sets: [makeSet()],
    ...overrides,
  }
}

function submit() {
  fireEvent.click(screen.getByTestId('update-workout-button'))
}

describe('EditWorkoutForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateAsync.mockResolvedValue({})
    updateWorkoutId = undefined
  })

  it('pre-fills the form from the workout', () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    expect(screen.getByTestId('workout-name-input')).toHaveValue('Leg Day')
    expect(screen.getByPlaceholderText(/Brief description/)).toHaveValue(
      'Lower body'
    )
    expect(screen.getByPlaceholderText(/HIIT, Strength/)).toHaveValue(
      'strength, legs'
    )
    expect(updateWorkoutId).toBe('w1')
  })

  it('handles null description and tags', () => {
    render(
      <EditWorkoutForm
        workout={makeWorkout({ description: null, tags: null })}
      />
    )

    expect(screen.getByPlaceholderText(/Brief description/)).toHaveValue('')
    expect(screen.getByPlaceholderText(/HIIT, Strength/)).toHaveValue('')
  })

  it('submits the edited workout and returns home', async () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    fireEvent.change(screen.getByTestId('workout-name-input'), {
      target: { value: 'Leg Day v2' },
    })
    submit()

    await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
    expect(mutateAsync).toHaveBeenCalledWith({
      name: 'Leg Day v2',
      description: 'Lower body',
      tags: ['strength', 'legs'],
      isPublic: false,
      sets: [
        {
          repeatCount: 2,
          restBetweenExercises: 10,
          restBetweenRepeats: 20,
          restBetweenSets: 30,
          exercises: [{ name: 'Burpees', workDuration: 40 }],
        },
      ],
    })
  })

  it('trims text, splits tags and drops a blank description', async () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    fireEvent.change(screen.getByTestId('workout-name-input'), {
      target: { value: '  Spaced Out  ' },
    })
    fireEvent.change(screen.getByPlaceholderText(/Brief description/), {
      target: { value: '   ' },
    })
    fireEvent.change(screen.getByPlaceholderText(/HIIT, Strength/), {
      target: { value: ' hiit , ,cardio,  ' },
    })
    submit()

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    const data = mutateAsync.mock.calls[0][0]
    expect(data.name).toBe('Spaced Out')
    expect(data.description).toBeUndefined()
    expect(data.tags).toEqual(['hiit', 'cardio'])
  })

  it('toggles the public flag', async () => {
    render(<EditWorkoutForm workout={makeWorkout({ isPublic: false })} />)

    const toggle = screen
      .getByText('Public workout')
      .closest('div')!
      .parentElement!.querySelector('button')!
    fireEvent.click(toggle)
    submit()

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0][0].isPublic).toBe(true)
  })

  it('clamps out-of-range numbers and drops unnamed exercises and empty sets', async () => {
    render(
      <EditWorkoutForm
        workout={makeWorkout({
          sets: [
            makeSet({
              id: 's1',
              repeatCount: 0,
              restBetweenExercises: -5,
              restBetweenRepeats: -1,
              restBetweenSets: -10,
              exercises: [
                { id: 'a', name: '  Plank  ', workDuration: 0, order: 0 },
                { id: 'b', name: '   ', workDuration: 30, order: 1 },
              ],
            }),
            makeSet({
              id: 's2',
              exercises: [{ id: 'c', name: '', workDuration: 30, order: 0 }],
            }),
          ],
        })}
      />
    )
    submit()

    await waitFor(() => expect(mutateAsync).toHaveBeenCalled())
    expect(mutateAsync.mock.calls[0][0].sets).toEqual([
      {
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenRepeats: 0,
        restBetweenSets: 0,
        exercises: [{ name: 'Plank', workDuration: 1 }],
      },
    ])
  })

  it('does not submit when no set has a named exercise', async () => {
    render(
      <EditWorkoutForm
        workout={makeWorkout({
          sets: [
            makeSet({
              exercises: [{ id: 'a', name: ' ', workDuration: 30, order: 0 }],
            }),
          ],
        })}
      />
    )
    submit()

    await waitFor(() =>
      expect(screen.getByTestId('update-workout-button')).toHaveTextContent(
        'Update Workout'
      )
    )
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('disables submit while the name is blank', () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    fireEvent.change(screen.getByTestId('workout-name-input'), {
      target: { value: '   ' },
    })

    expect(screen.getByTestId('update-workout-button')).toBeDisabled()
  })

  it('does not submit a blank name even if the form is submitted directly', () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    fireEvent.change(screen.getByTestId('workout-name-input'), {
      target: { value: '   ' },
    })
    fireEvent.submit(screen.getByTestId('workout-name-input').closest('form')!)

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  it('shows a saving state while the update is in flight', async () => {
    let resolve!: () => void
    mutateAsync.mockReturnValue(new Promise<void>((r) => (resolve = r)))
    render(<EditWorkoutForm workout={makeWorkout()} />)

    submit()

    expect(await screen.findByText('Saving...')).toBeInTheDocument()
    expect(screen.getByTestId('update-workout-button')).toBeDisabled()

    resolve()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/'))
  })

  it('cancels back to home without saving', () => {
    render(<EditWorkoutForm workout={makeWorkout()} />)

    fireEvent.click(screen.getByTestId('cancel-button'))

    expect(push).toHaveBeenCalledWith('/')
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
