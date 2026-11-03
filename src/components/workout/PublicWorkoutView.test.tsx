import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PublicWorkoutView from './PublicWorkoutView'
import { useTimerStore } from '@/lib/timer/store'
import { cloneWorkout } from '@/lib/workout/api'
import { useSession } from 'next-auth/react'
import type { Workout } from '@/lib/workout/types'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('next-auth/react', () => ({
  useSession: vi.fn(),
}))

vi.mock('@/lib/workout/api', () => ({
  cloneWorkout: vi.fn(),
}))

const workout: Workout = {
  id: 'pub-1',
  name: 'Community Burner',
  description: 'Full body',
  slug: 'community-burner',
  isPublic: true,
  sets: [
    {
      id: 's1',
      order: 0,
      repeatCount: 3,
      restBetweenExercises: 15,
      restBetweenRepeats: 30,
      restBetweenSets: 60,
      exercises: [
        { id: 'e1', name: 'Jumping Jacks', workDuration: 45, order: 0 },
        { id: 'e2', name: 'Lunges', workDuration: 30, order: 1 },
      ],
    },
    {
      id: 's2',
      order: 1,
      repeatCount: 1,
      restBetweenExercises: 0,
      restBetweenRepeats: 0,
      restBetweenSets: 0,
      exercises: [{ id: 'e3', name: 'Plank', workDuration: 60, order: 0 }],
    },
  ],
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

function signedIn() {
  vi.mocked(useSession).mockReturnValue({
    data: { user: { id: 'u1' }, expires: '2099-01-01' },
    status: 'authenticated',
    update: vi.fn(),
  } as ReturnType<typeof useSession>)
}

function signedOut() {
  vi.mocked(useSession).mockReturnValue({
    data: null,
    status: 'unauthenticated',
    update: vi.fn(),
  } as ReturnType<typeof useSession>)
}

describe('PublicWorkoutView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useTimerStore.setState({ workout: null, phase: 'idle', isRunning: false })
  })

  describe('workout details', () => {
    beforeEach(signedOut)

    it('renders the name and description', () => {
      render(<PublicWorkoutView workout={workout} />)

      expect(
        screen.getByRole('heading', { name: 'Community Burner' })
      ).toBeInTheDocument()
      expect(screen.getByText('Full body')).toBeInTheDocument()
    })

    it('omits the description when there is none', () => {
      render(
        <PublicWorkoutView workout={{ ...workout, description: undefined }} />
      )
      expect(screen.queryByText('Full body')).not.toBeInTheDocument()
    })

    it('lists each set with its non-zero rest periods', () => {
      render(<PublicWorkoutView workout={workout} />)

      expect(screen.getByText('Set 1')).toBeInTheDocument()
      expect(screen.getByText('Repeat 3x')).toBeInTheDocument()
      expect(screen.getByText('15s between exercises')).toBeInTheDocument()
      expect(screen.getByText('30s between repeats')).toBeInTheDocument()
      expect(screen.getByText('60s between sets')).toBeInTheDocument()

      expect(screen.getByText('Set 2')).toBeInTheDocument()
      expect(screen.getAllByText(/between exercises/)).toHaveLength(1)
      expect(screen.getAllByText(/between repeats/)).toHaveLength(1)
      expect(screen.getAllByText(/between sets/)).toHaveLength(1)
    })

    it('lists exercises in order with durations', () => {
      render(<PublicWorkoutView workout={workout} />)

      expect(screen.getByText(/1\. Jumping Jacks · 45s/)).toBeInTheDocument()
      expect(screen.getByText(/2\. Lunges · 30s/)).toBeInTheDocument()
      expect(screen.getByText(/1\. Plank · 60s/)).toBeInTheDocument()
    })
  })

  describe('start', () => {
    it('loads the workout into the timer and navigates, even when signed out', () => {
      signedOut()
      render(<PublicWorkoutView workout={workout} />)

      fireEvent.click(screen.getByRole('button', { name: 'Start Workout' }))

      expect(useTimerStore.getState().workout).toEqual({
        id: workout.id,
        name: workout.name,
        description: workout.description,
        sets: workout.sets,
      })
      expect(push).toHaveBeenCalledWith('/timer')
    })
  })

  describe('signed out', () => {
    beforeEach(signedOut)

    it('offers sign-in instead of clone and hides My Workouts', () => {
      render(<PublicWorkoutView workout={workout} />)

      expect(
        screen.getByRole('link', { name: 'Sign in to Clone' })
      ).toHaveAttribute('href', '/login')
      expect(
        screen.queryByRole('button', { name: 'Clone to My Workouts' })
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: 'My Workouts' })
      ).not.toBeInTheDocument()
    })
  })

  describe('signed in', () => {
    beforeEach(signedIn)

    it('shows the My Workouts link', () => {
      render(<PublicWorkoutView workout={workout} />)
      expect(screen.getByRole('link', { name: 'My Workouts' })).toHaveAttribute(
        'href',
        '/'
      )
    })

    it('clones the workout and opens the copy for editing', async () => {
      vi.mocked(cloneWorkout).mockResolvedValue({ ...workout, id: 'copy-9' })
      render(<PublicWorkoutView workout={workout} />)

      fireEvent.click(
        screen.getByRole('button', { name: 'Clone to My Workouts' })
      )

      await waitFor(() =>
        expect(push).toHaveBeenCalledWith('/workouts/copy-9/edit')
      )
      expect(cloneWorkout).toHaveBeenCalledWith('pub-1')
    })

    it('disables the clone button while cloning', async () => {
      let resolve!: (w: Workout) => void
      vi.mocked(cloneWorkout).mockReturnValue(
        new Promise<Workout>((r) => (resolve = r))
      )
      render(<PublicWorkoutView workout={workout} />)

      fireEvent.click(
        screen.getByRole('button', { name: 'Clone to My Workouts' })
      )

      const busy = await screen.findByRole('button', { name: 'Cloning...' })
      expect(busy).toBeDisabled()

      resolve({ ...workout, id: 'copy-1' })
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Clone to My Workouts' })
        ).toBeEnabled()
      )
    })

    it('alerts and re-enables the button when cloning fails', async () => {
      vi.mocked(cloneWorkout).mockRejectedValue(new Error('boom'))
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
      render(<PublicWorkoutView workout={workout} />)

      fireEvent.click(
        screen.getByRole('button', { name: 'Clone to My Workouts' })
      )

      await waitFor(() =>
        expect(alertSpy).toHaveBeenCalledWith('Failed to clone workout')
      )
      expect(push).not.toHaveBeenCalled()
      expect(
        screen.getByRole('button', { name: 'Clone to My Workouts' })
      ).toBeEnabled()
    })
  })
})
