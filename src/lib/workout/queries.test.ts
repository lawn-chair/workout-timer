import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import {
  useWorkouts,
  useWorkout,
  useCreateWorkout,
  useUpdateWorkout,
  useDeleteWorkout,
  useCloneWorkout,
  workoutKeys,
} from './queries'

const mockWorkout = {
  id: '1',
  name: 'Test Workout',
  description: 'Test description',
  sets: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}

describe('workout queries', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  describe('useWorkouts', () => {
    it('fetches workouts from API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockWorkout],
      } as Response)

      const { result } = renderHook(() => useWorkouts(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual([mockWorkout])
    })

    it('returns initialData immediately without fetching', () => {
      const { result } = renderHook(
        () => useWorkouts([mockWorkout] as (typeof mockWorkout)[]),
        { wrapper: createWrapper() }
      )

      expect(result.current.data).toEqual([mockWorkout])
    })
  })

  describe('useCreateWorkout', () => {
    it('creates a workout and invalidates the list', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)

      const { result } = renderHook(() => useCreateWorkout(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: 'New Workout', sets: [] })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockWorkout)
    })

    it('surfaces API errors', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      } as Response)

      const { result } = renderHook(() => useCreateWorkout(), {
        wrapper: createWrapper(),
      })

      result.current.mutate({ name: 'New Workout', sets: [] })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Nope')
    })
  })

  describe('useDeleteWorkout', () => {
    it('optimistically removes the workout from the list', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      })
      queryClient.setQueryData(['workouts'], [mockWorkout])

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useDeleteWorkout(), { wrapper })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(queryClient.getQueryData(['workouts'])).toEqual([])
    })

    it('restores the previous list when the delete fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Forbidden' }),
      } as Response)

      const queryClient = createClient()
      const other = { ...mockWorkout, id: '2', name: 'Other' }
      queryClient.setQueryData(workoutKeys.all, [mockWorkout, other])

      const { result } = renderHook(() => useDeleteWorkout(), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Forbidden')
      expect(queryClient.getQueryData(workoutKeys.all)).toEqual([
        mockWorkout,
        other,
      ])
    })

    it('handles deleting when no list is cached yet', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)
      const queryClient = createClient()

      const { result } = renderHook(() => useDeleteWorkout(), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(fetch).toHaveBeenCalledWith('/api/workouts/1', {
        method: 'DELETE',
      })
    })
  })

  describe('useWorkout', () => {
    it('fetches a single workout by id under its detail key', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)
      const queryClient = createClient()

      const { result } = renderHook(() => useWorkout('1'), {
        wrapper: wrapperFor(queryClient),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(fetch).toHaveBeenCalledWith('/api/workouts/1', {
        cache: 'no-store',
      })
      expect(queryClient.getQueryData(workoutKeys.detail('1'))).toEqual(
        mockWorkout
      )
    })

    it('surfaces fetch failures', async () => {
      vi.mocked(fetch).mockResolvedValue({ ok: false } as Response)

      const { result } = renderHook(() => useWorkout('missing'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Failed to fetch workout')
    })
  })

  describe('useUpdateWorkout', () => {
    it('writes the updated workout to the detail cache and invalidates the list', async () => {
      const updated = { ...mockWorkout, name: 'Renamed' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => updated,
      } as Response)

      const queryClient = createClient()
      queryClient.setQueryData(workoutKeys.detail('1'), mockWorkout)
      queryClient.setQueryData(workoutKeys.all, [mockWorkout])
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useUpdateWorkout('1'), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate({ name: 'Renamed', sets: [] })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetch).toHaveBeenCalledWith(
        '/api/workouts/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ name: 'Renamed', sets: [] }),
        })
      )
      expect(queryClient.getQueryData(workoutKeys.detail('1'))).toEqual(updated)
      expect(invalidate).toHaveBeenCalledWith({ queryKey: workoutKeys.all })
    })

    it('leaves the detail cache untouched when the update fails', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Invalid input' }),
      } as Response)

      const queryClient = createClient()
      queryClient.setQueryData(workoutKeys.detail('1'), mockWorkout)

      const { result } = renderHook(() => useUpdateWorkout('1'), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate({ name: '', sets: [] })
      await waitFor(() => expect(result.current.isError).toBe(true))

      expect(result.current.error?.message).toBe('Invalid input')
      expect(queryClient.getQueryData(workoutKeys.detail('1'))).toEqual(
        mockWorkout
      )
    })
  })

  describe('useCloneWorkout', () => {
    it('clones a workout and invalidates the list', async () => {
      const clone = { ...mockWorkout, id: '99', name: 'Test Workout (copy)' }
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => clone,
      } as Response)

      const queryClient = createClient()
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

      const { result } = renderHook(() => useCloneWorkout(), {
        wrapper: wrapperFor(queryClient),
      })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(fetch).toHaveBeenCalledWith('/api/workouts/1/clone', {
        method: 'POST',
      })
      expect(result.current.data).toEqual(clone)
      expect(invalidate).toHaveBeenCalledWith({ queryKey: workoutKeys.all })
    })

    it('surfaces clone failures', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({}),
      } as Response)

      const { result } = renderHook(() => useCloneWorkout(), {
        wrapper: createWrapper(),
      })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe('Failed to clone workout')
    })
  })
})

function createClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
}

function wrapperFor(queryClient: QueryClient) {
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
  Wrapper.displayName = 'QueryClientWrapper'
  return Wrapper
}
