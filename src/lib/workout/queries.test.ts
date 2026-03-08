import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { useWorkouts, useCreateWorkout, useDeleteWorkout } from './queries'

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
  return ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children)
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
        () => useWorkouts([mockWorkout] as typeof mockWorkout[]),
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
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      })
      queryClient.setQueryData(['workouts'], [mockWorkout])

      const wrapper = ({ children }: { children: React.ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children)

      const { result } = renderHook(() => useDeleteWorkout(), { wrapper })

      result.current.mutate('1')
      await waitFor(() => expect(result.current.isSuccess).toBe(true))

      expect(queryClient.getQueryData(['workouts'])).toEqual([])
    })
  })
})
