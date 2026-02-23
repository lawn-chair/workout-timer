import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState, type ReactNode } from 'react'

let latestOnDragEnd: ((event: unknown) => void) | null = null

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({
    children,
    onDragEnd,
  }: {
    children: ReactNode
    onDragEnd?: (event: unknown) => void
  }) => {
    latestOnDragEnd = onDragEnd ?? null
    return <div data-testid="dnd-context">{children}</div>
  },
  useSensor: () => ({}),
  useSensors: () => ({}),
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCenter: () => null,
}))

vi.mock('@dnd-kit/sortable', () => ({
  SortableContext: ({ children }: { children: ReactNode }) => (
    <div data-testid="sortable-context">{children}</div>
  ),
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    setActivatorNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  }),
  verticalListSortingStrategy: () => null,
  sortableKeyboardCoordinates: () => null,
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

import WorkoutBuilderSets from './WorkoutBuilderSets'
import { SetDraft } from '@/lib/workout/builder'

const makeSets = (): SetDraft[] => [
  {
    clientId: 'set-a',
    repeatCount: 1,
    restBetweenExercises: 0,
    restBetweenSets: 0,
    exercises: [
      { clientId: 'ex-a1', name: 'Jumping Jacks', workDuration: 30 },
      { clientId: 'ex-a2', name: 'Burpees', workDuration: 30 },
    ],
  },
  {
    clientId: 'set-b',
    repeatCount: 2,
    restBetweenExercises: 10,
    restBetweenSets: 20,
    exercises: [
      { clientId: 'ex-b1', name: 'Planks', workDuration: 45 },
      { clientId: 'ex-b2', name: 'Squats', workDuration: 40 },
    ],
  },
]

describe('WorkoutBuilderSets', () => {
  const Harness = ({ initial }: { initial: SetDraft[] }) => {
    const [sets, setSets] = useState(initial)
    return <WorkoutBuilderSets sets={sets} onSetsChange={setSets} />
  }

  it('renders sets and exercises in order', () => {
    const sets = makeSets()

    render(<Harness initial={sets} />)

    const setLabels = screen.getAllByText(/Set \d/)
    expect(setLabels[0]).toHaveTextContent('Set 1')
    expect(setLabels[1]).toHaveTextContent('Set 2')

    const exerciseLabels = screen.getAllByText(/Exercise \d/)
    expect(exerciseLabels[0]).toHaveTextContent('Exercise 1')
    expect(exerciseLabels[1]).toHaveTextContent('Exercise 2')
  })

  it('adds and removes sets via actions', () => {
    const sets = makeSets()
    render(<Harness initial={sets} />)

    fireEvent.click(screen.getByTestId('add-set-button'))
    expect(screen.getAllByText(/Set \d/)).toHaveLength(3)

    fireEvent.click(screen.getByTestId('remove-set-button-0'))
    expect(screen.getAllByText(/Set \d/)).toHaveLength(2)
  })

  it('updates set fields and exercises', () => {
    const sets = makeSets()
    render(<Harness initial={sets} />)

    fireEvent.change(screen.getByTestId('set-repeat-input-0'), {
      target: { value: '3' },
    })

    fireEvent.change(screen.getByTestId('rest-between-exercises-input-0'), {
      target: { value: '15' },
    })

    fireEvent.change(screen.getByTestId('rest-between-sets-input-0'), {
      target: { value: '20' },
    })

    fireEvent.change(screen.getByTestId('exercise-name-input-0-0'), {
      target: { value: 'Lunges' },
    })

    fireEvent.change(screen.getByTestId('exercise-work-input-0-0'), {
      target: { value: '45' },
    })

    expect(screen.getByTestId('set-repeat-input-0')).toHaveValue(3)
    expect(screen.getByTestId('rest-between-exercises-input-0')).toHaveValue(15)
    expect(screen.getByTestId('rest-between-sets-input-0')).toHaveValue(20)
    expect(screen.getByTestId('exercise-name-input-0-0')).toHaveValue('Lunges')
    expect(screen.getByTestId('exercise-work-input-0-0')).toHaveValue(45)
  })

  it('adds and removes exercises', () => {
    const sets = makeSets()
    render(<Harness initial={sets} />)

    fireEvent.click(screen.getByTestId('add-exercise-button-0'))
    expect(screen.getAllByText(/Exercise \d/)).toHaveLength(5)

    fireEvent.click(screen.getByTestId('remove-exercise-button-0-0'))
    expect(screen.getAllByText(/Exercise \d/)).toHaveLength(4)
  })

  it('reorders sets and exercises via drag end', () => {
    const sets = makeSets()
    const { container } = render(<Harness initial={sets} />)

    act(() => {
      latestOnDragEnd?.({
        active: { id: 'set-b', data: { current: { type: 'set' } } },
        over: { id: 'set-a', data: { current: { type: 'set' } } },
      })
    })

    const setCards = container.querySelectorAll('[data-sortable-type="set"]')
    expect(setCards[0]?.getAttribute('data-set-id')).toBe('set-b')

    act(() => {
      latestOnDragEnd?.({
        active: {
          id: 'ex-a2',
          data: { current: { type: 'exercise', setId: 'set-a' } },
        },
        over: {
          id: 'ex-a1',
          data: { current: { type: 'exercise', setId: 'set-a' } },
        },
      })
    })

    const exerciseCards = container.querySelectorAll(
      '[data-sortable-type="exercise"][data-set-id="set-a"]'
    )
    expect(exerciseCards[0]?.getAttribute('data-exercise-id')).toBe('ex-a2')
  })

  it('ignores unknown drag type', () => {
    const sets = makeSets()
    const { container } = render(<Harness initial={sets} />)

    act(() => {
      latestOnDragEnd?.({
        active: { id: 'set-b', data: { current: { type: 'unknown' } } },
        over: { id: 'set-a', data: { current: { type: 'set' } } },
      })
    })

    const setCards = container.querySelectorAll('[data-sortable-type="set"]')
    expect(setCards[0]?.getAttribute('data-set-id')).toBe('set-a')
  })

  it('renders empty state when no sets', () => {
    render(<Harness initial={[]} />)
    expect(
      screen.getByText('No sets yet. Click "Add Set" to get started.')
    ).toBeInTheDocument()
  })

  it('renders empty exercises message when a set has none', () => {
    const sets: SetDraft[] = [
      {
        clientId: 'set-empty',
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [],
      },
    ]

    render(<Harness initial={sets} />)

    expect(
      screen.getByText('No exercises yet. Click "Add Exercise" to get started.')
    ).toBeInTheDocument()
  })

  it('hides remove buttons when only one item', () => {
    const sets: SetDraft[] = [
      {
        clientId: 'set-only',
        repeatCount: 1,
        restBetweenExercises: 0,
        restBetweenSets: 0,
        exercises: [
          { clientId: 'ex-only', name: 'Push Ups', workDuration: 30 },
        ],
      },
    ]
    render(<Harness initial={sets} />)

    expect(screen.queryByTestId('remove-set-button-0')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Remove' })).toBeNull()
  })

  it('ignores drag end when over is missing', () => {
    const sets = makeSets()
    const { container } = render(<Harness initial={sets} />)

    act(() => {
      latestOnDragEnd?.({
        active: { id: 'set-b', data: { current: { type: 'set' } } },
        over: null,
      })
    })

    const setCards = container.querySelectorAll('[data-sortable-type="set"]')
    expect(setCards[0]?.getAttribute('data-set-id')).toBe('set-a')
  })

  it('ignores exercise drag when set id is missing', () => {
    const sets = makeSets()
    const { container } = render(<Harness initial={sets} />)

    act(() => {
      latestOnDragEnd?.({
        active: { id: 'ex-a1', data: { current: { type: 'exercise' } } },
        over: {
          id: 'ex-a2',
          data: { current: { type: 'exercise', setId: 'set-a' } },
        },
      })
    })

    const exerciseCards = container.querySelectorAll(
      '[data-sortable-type="exercise"][data-set-id="set-a"]'
    )
    expect(exerciseCards[0]?.getAttribute('data-exercise-id')).toBe('ex-a1')
  })

  it('ignores exercise drag when set ids differ', () => {
    const sets = makeSets()
    const { container } = render(<Harness initial={sets} />)

    act(() => {
      latestOnDragEnd?.({
        active: {
          id: 'ex-a2',
          data: { current: { type: 'exercise', setId: 'set-a' } },
        },
        over: {
          id: 'ex-b1',
          data: { current: { type: 'exercise', setId: 'set-b' } },
        },
      })
    })

    const exerciseCards = container.querySelectorAll(
      '[data-sortable-type="exercise"][data-set-id="set-a"]'
    )
    expect(exerciseCards[0]?.getAttribute('data-exercise-id')).toBe('ex-a1')
  })
})
