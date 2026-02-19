import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutStore, WorkoutFormData } from './store'

global.fetch = vi.fn()

const mockWorkout = {
  id: '1',
  name: 'Test Workout',
  description: 'Test description',
  exercises: [],
  createdAt: new Date(),
  updatedAt: new Date(),
}

describe('workout store', () => {
  beforeEach(() => {
    useWorkoutStore.setState({
      workouts: [],
      currentWorkout: null,
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  describe('fetchWorkouts', () => {
    it('should fetch workouts from API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => [mockWorkout],
      } as Response)

      await useWorkoutStore.getState().fetchWorkouts()

      expect(useWorkoutStore.getState().workouts).toEqual([mockWorkout])
      expect(useWorkoutStore.getState().isLoading).toBe(false)
    })

    it('should handle fetch error', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response)

      await useWorkoutStore.getState().fetchWorkouts()

      expect(useWorkoutStore.getState().error).toBeDefined()
    })
  })

  describe('createWorkout', () => {
    it('should create workout via API', async () => {
      const data: WorkoutFormData = {
        name: 'New Workout',
        exercises: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)

      const result = await useWorkoutStore.getState().createWorkout(data)

      expect(result).toEqual(mockWorkout)
      expect(useWorkoutStore.getState().workouts).toContain(mockWorkout)
    })
  })

  describe('deleteWorkout', () => {
    it('should delete workout via API', async () => {
      useWorkoutStore.setState({ workouts: [mockWorkout] })

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
      } as Response)

      await useWorkoutStore.getState().deleteWorkout('1')

      expect(useWorkoutStore.getState().workouts).toHaveLength(0)
    })
  })
})
