import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react'
import type { ImgHTMLAttributes } from 'react'
import WorkoutList from './WorkoutList'
import { useTimerStore } from '@/lib/timer/store'
import { deleteWorkout, fetchPublicWorkouts } from '@/lib/workout/api'
import { signOut } from 'next-auth/react'
import type { Workout, WorkoutSet } from '@/lib/workout/types'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}))

vi.mock('next/image', () => ({
  default: ({ src, alt }: ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

vi.mock('@/lib/workout/api', () => ({
  deleteWorkout: vi.fn(),
  fetchPublicWorkouts: vi.fn(),
}))

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'set-1',
    order: 0,
    repeatCount: 1,
    restBetweenExercises: 0,
    restBetweenRepeats: 0,
    restBetweenSets: 0,
    exercises: [{ id: 'ex-1', name: 'Squats', workDuration: 60, order: 0 }],
    ...overrides,
  }
}

function makeWorkout(overrides: Partial<Workout> = {}): Workout {
  return {
    id: 'w1',
    name: 'Leg Day',
    description: 'Lower body focus',
    tags: ['strength'],
    isPublic: false,
    sets: [makeSet()],
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

const user = { id: 'u1', name: 'Alex Runner', email: 'alex@example.com' }

function renderList(workouts: Workout[], userOverride = user) {
  return render(<WorkoutList initialWorkouts={workouts} user={userOverride} />)
}

describe('WorkoutList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTimerStore.setState({ workout: null, phase: 'idle', isRunning: false })
  })

  describe('empty state', () => {
    it('prompts to create a first workout when the library is empty', () => {
      renderList([])

      expect(screen.getByText('No workouts yet')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Create your first workout' })
      ).toHaveAttribute('href', '/workouts/new')
    })
  })

  describe('workout cards', () => {
    it('renders name, description, public badge and tags', () => {
      renderList([makeWorkout({ isPublic: true, tags: ['strength', 'legs'] })])

      const card = screen.getByTestId('workout-card-w1')
      expect(within(card).getByText('Leg Day')).toBeInTheDocument()
      expect(within(card).getByText('Lower body focus')).toBeInTheDocument()
      expect(within(card).getByText('Public')).toBeInTheDocument()
      expect(within(card).getByText('strength')).toBeInTheDocument()
      expect(within(card).getByText('legs')).toBeInTheDocument()
    })

    it('omits the public badge, description and tags when absent', () => {
      renderList([
        makeWorkout({ isPublic: false, description: undefined, tags: [] }),
      ])

      const card = screen.getByTestId('workout-card-w1')
      expect(within(card).queryByText('Public')).not.toBeInTheDocument()
      expect(
        within(card).queryByText('Lower body focus')
      ).not.toBeInTheDocument()
    })

    it('computes exercise count, set count and estimated minutes', () => {
      // Set 1: 2 exercises x 60s + 30s rest between = 150s, x2 repeats + 60s
      //        rest between repeats = 360s, + 90s rest before the next set.
      // Set 2: 1 exercise x 45s = 45s.
      // Total 495s -> rounds to 8 min.
      renderList([
        makeWorkout({
          sets: [
            makeSet({
              id: 's1',
              repeatCount: 2,
              restBetweenExercises: 30,
              restBetweenRepeats: 60,
              restBetweenSets: 90,
              exercises: [
                { id: 'a', name: 'A', workDuration: 60, order: 0 },
                { id: 'b', name: 'B', workDuration: 60, order: 1 },
              ],
            }),
            makeSet({
              id: 's2',
              exercises: [{ id: 'c', name: 'C', workDuration: 45, order: 0 }],
            }),
          ],
        }),
      ])

      expect(screen.getByTestId('stat-exercises-w1')).toHaveTextContent('3')
      expect(screen.getByTestId('stat-sets-w1')).toHaveTextContent('2')
      expect(screen.getByTestId('stat-time-w1')).toHaveTextContent('8 min')
    })

    it('shows at least 1 minute for very short workouts', () => {
      renderList([
        makeWorkout({
          sets: [
            makeSet({
              exercises: [{ id: 'a', name: 'A', workDuration: 5, order: 0 }],
            }),
          ],
        }),
      ])

      expect(screen.getByTestId('stat-time-w1')).toHaveTextContent('1 min')
    })

    it('links Edit to the workout edit page', () => {
      renderList([makeWorkout()])

      expect(screen.getByTestId('edit-workout-w1')).toHaveAttribute(
        'href',
        '/workouts/w1/edit'
      )
    })
  })

  describe('tag filter', () => {
    const workouts = [
      makeWorkout({ id: 'w1', name: 'Leg Day', tags: ['strength'] }),
      makeWorkout({ id: 'w2', name: 'Sprints', tags: ['cardio'] }),
      makeWorkout({ id: 'w3', name: 'Mixed', tags: ['strength', 'cardio'] }),
      makeWorkout({ id: 'w4', name: 'Untagged', tags: undefined }),
    ]

    it('shows one filter button per unique tag plus All', () => {
      renderList(workouts)

      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: 'strength' })).toHaveLength(
        1
      )
      expect(screen.getAllByRole('button', { name: 'cardio' })).toHaveLength(1)
    })

    it('filters to workouts with the selected tag and resets with All', () => {
      renderList(workouts)

      fireEvent.click(screen.getByRole('button', { name: 'cardio' }))
      expect(screen.queryByTestId('workout-card-w1')).not.toBeInTheDocument()
      expect(screen.getByTestId('workout-card-w2')).toBeInTheDocument()
      expect(screen.getByTestId('workout-card-w3')).toBeInTheDocument()
      expect(screen.queryByTestId('workout-card-w4')).not.toBeInTheDocument()

      fireEvent.click(screen.getByRole('button', { name: 'All' }))
      for (const id of ['w1', 'w2', 'w3', 'w4']) {
        expect(screen.getByTestId(`workout-card-${id}`)).toBeInTheDocument()
      }
    })

    it('hides the filter bar when no workout has tags', () => {
      renderList([makeWorkout({ tags: [] })])
      expect(
        screen.queryByRole('button', { name: 'All' })
      ).not.toBeInTheDocument()
    })
  })

  describe('start', () => {
    it('loads the workout into the timer store and navigates to the timer', () => {
      const workout = makeWorkout()
      useTimerStore.setState({ phase: 'work', isRunning: true })
      renderList([workout])

      fireEvent.click(screen.getByTestId('start-workout-w1'))

      const state = useTimerStore.getState()
      expect(state.workout).toEqual({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        sets: workout.sets,
      })
      expect(state.phase).toBe('idle')
      expect(state.isRunning).toBe(false)
      expect(push).toHaveBeenCalledWith('/timer')
    })
  })

  describe('delete', () => {
    it('deletes after confirmation and removes the card', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(deleteWorkout).mockResolvedValue(true)
      renderList([makeWorkout({ id: 'w1' }), makeWorkout({ id: 'w2' })])

      fireEvent.click(screen.getByTestId('delete-workout-w1'))

      expect(window.confirm).toHaveBeenCalledWith('Delete this workout?')
      await waitFor(() =>
        expect(screen.queryByTestId('workout-card-w1')).not.toBeInTheDocument()
      )
      expect(deleteWorkout).toHaveBeenCalledWith('w1')
      expect(screen.getByTestId('workout-card-w2')).toBeInTheDocument()
    })

    it('does nothing when the confirmation is cancelled', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderList([makeWorkout()])

      fireEvent.click(screen.getByTestId('delete-workout-w1'))

      expect(deleteWorkout).not.toHaveBeenCalled()
      expect(screen.getByTestId('workout-card-w1')).toBeInTheDocument()
    })

    it('shows the empty state after deleting the last workout', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      vi.mocked(deleteWorkout).mockResolvedValue(true)
      renderList([makeWorkout()])

      fireEvent.click(screen.getByTestId('delete-workout-w1'))

      expect(await screen.findByText('No workouts yet')).toBeInTheDocument()
    })
  })

  describe('public library', () => {
    it('fetches public workouts on first toggle and renders them', async () => {
      vi.mocked(fetchPublicWorkouts).mockResolvedValue([
        makeWorkout({ id: 'p1', name: 'Community Burner', slug: 'burner' }),
        makeWorkout({ id: 'p2', name: 'No Slug', slug: undefined }),
      ])
      renderList([makeWorkout()])

      fireEvent.click(screen.getByRole('button', { name: 'Browse Public' }))

      expect(
        screen.getByRole('heading', { name: 'Public Workouts' })
      ).toBeInTheDocument()
      expect(await screen.findByText('Community Burner')).toBeInTheDocument()
      expect(
        screen.getByRole('link', { name: 'Community Burner' })
      ).toHaveAttribute('href', '/w/burner')
      expect(screen.getByRole('link', { name: 'No Slug' })).toHaveAttribute(
        'href',
        '/w/p2'
      )
      expect(fetchPublicWorkouts).toHaveBeenCalledTimes(1)
    })

    it('does not refetch after public workouts are loaded', async () => {
      vi.mocked(fetchPublicWorkouts).mockResolvedValue([
        makeWorkout({ id: 'p1', name: 'Community Burner' }),
      ])
      renderList([makeWorkout()])

      fireEvent.click(screen.getByRole('button', { name: 'Browse Public' }))
      await screen.findByText('Community Burner')
      fireEvent.click(screen.getByRole('button', { name: 'My Workouts' }))
      fireEvent.click(screen.getByRole('button', { name: 'Browse Public' }))

      expect(fetchPublicWorkouts).toHaveBeenCalledTimes(1)
    })

    it('shows an empty state when there are no public workouts', async () => {
      vi.mocked(fetchPublicWorkouts).mockResolvedValue([])
      renderList([makeWorkout()])

      fireEvent.click(screen.getByRole('button', { name: 'Browse Public' }))

      expect(
        await screen.findByText('No public workouts yet')
      ).toBeInTheDocument()
    })

    it('returns to the personal library', async () => {
      vi.mocked(fetchPublicWorkouts).mockResolvedValue([])
      renderList([makeWorkout()])

      fireEvent.click(screen.getByRole('button', { name: 'Browse Public' }))
      await waitFor(() => expect(fetchPublicWorkouts).toHaveBeenCalled())
      fireEvent.click(screen.getByRole('button', { name: 'My Workouts' }))

      expect(
        screen.getByRole('heading', { name: 'Your Workouts' })
      ).toBeInTheDocument()
      expect(screen.getByTestId('workout-card-w1')).toBeInTheDocument()
    })
  })

  describe('header', () => {
    it('shows the user avatar image when available', () => {
      renderList([], {
        ...user,
        image: 'https://example.com/a.png',
      } as typeof user)

      expect(screen.getByAltText('User avatar')).toHaveAttribute(
        'src',
        'https://example.com/a.png'
      )
      expect(screen.getByText('Alex Runner')).toBeInTheDocument()
    })

    it('falls back to initials when there is no avatar image', () => {
      renderList([])
      expect(screen.getByLabelText('User avatar')).toHaveTextContent('Al')
    })

    it('falls back to "Us" when the user has no name', () => {
      renderList([], {
        id: 'u1',
        name: null,
        email: null,
      } as unknown as typeof user)
      expect(screen.getByLabelText('User avatar')).toHaveTextContent('Us')
    })

    it('signs out to the login page', () => {
      renderList([])
      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }))
      expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })
  })
})
