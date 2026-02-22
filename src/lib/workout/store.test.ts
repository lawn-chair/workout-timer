import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useWorkoutStore, WorkoutFormData } from './store'

const mockWorkout = {
  id: '1',
  name: 'Test Workout',
  description: 'Test description',
  sets: [],
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
    vi.restoreAllMocks()
    global.fetch = vi.fn()
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

  describe('fetchWorkout', () => {
    it('should fetch workout by id', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)

      await useWorkoutStore.getState().fetchWorkout('1')

      expect(useWorkoutStore.getState().currentWorkout).toEqual(mockWorkout)
      expect(useWorkoutStore.getState().isLoading).toBe(false)
    })

    it('should store error on failure', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
      } as Response)

      await useWorkoutStore.getState().fetchWorkout('1')

      expect(useWorkoutStore.getState().error).toBeDefined()
    })
  })

  describe('createWorkout', () => {
    it('should create workout via API', async () => {
      const data: WorkoutFormData = {
        name: 'New Workout',
        sets: [],
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)

      const result = await useWorkoutStore.getState().createWorkout(data)

      expect(result).toEqual(mockWorkout)
      expect(useWorkoutStore.getState().workouts).toContain(mockWorkout)
    })

    it('should surface errors from API', async () => {
      const data: WorkoutFormData = { name: 'New Workout', sets: [] }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      } as Response)

      await expect(
        useWorkoutStore.getState().createWorkout(data)
      ).rejects.toThrow('Nope')
      expect(useWorkoutStore.getState().error).toBe('Nope')
    })
  })

  describe('updateWorkout', () => {
    it('should update workout via API', async () => {
      useWorkoutStore.setState({ workouts: [mockWorkout] })
      const data: WorkoutFormData = { name: 'Updated Workout', sets: [] }
      const updatedWorkout = { ...mockWorkout, name: 'Updated Workout' }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => updatedWorkout,
      } as Response)

      const result = await useWorkoutStore.getState().updateWorkout('1', data)

      expect(result).toEqual(updatedWorkout)
      expect(useWorkoutStore.getState().workouts[0]).toEqual(updatedWorkout)
      expect(useWorkoutStore.getState().currentWorkout).toEqual(updatedWorkout)
    })

    it('should surface errors from API', async () => {
      const data: WorkoutFormData = { name: 'Updated Workout', sets: [] }

      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      } as Response)

      await expect(
        useWorkoutStore.getState().updateWorkout('1', data)
      ).rejects.toThrow('Nope')
      expect(useWorkoutStore.getState().error).toBe('Nope')
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

    it('should surface errors from API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      } as Response)

      await expect(
        useWorkoutStore.getState().deleteWorkout('1')
      ).rejects.toThrow('Nope')
      expect(useWorkoutStore.getState().error).toBe('Nope')
    })
  })

  describe('cloneWorkout', () => {
    it('should clone workout via API', async () => {
      useWorkoutStore.setState({ workouts: [mockWorkout] })

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockWorkout,
      } as Response)

      const result = await useWorkoutStore.getState().cloneWorkout('1')

      expect(result).toEqual(mockWorkout)
      expect(useWorkoutStore.getState().workouts[0]).toEqual(mockWorkout)
    })

    it('should surface errors from API', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Nope' }),
      } as Response)

      await expect(
        useWorkoutStore.getState().cloneWorkout('1')
      ).rejects.toThrow('Nope')
      expect(useWorkoutStore.getState().error).toBe('Nope')
    })
  })

  describe('setCurrentWorkout', () => {
    it('should update current workout', () => {
      useWorkoutStore.getState().setCurrentWorkout(mockWorkout)

      expect(useWorkoutStore.getState().currentWorkout).toEqual(mockWorkout)
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      useWorkoutStore.setState({ error: 'Boom' })

      useWorkoutStore.getState().clearError()

      expect(useWorkoutStore.getState().error).toBeNull()
    })
  })

  describe('selectors', () => {
    it('getWorkout returns matching workout', async () => {
      const { getWorkout } = await import('./store')
      useWorkoutStore.setState({ workouts: [mockWorkout] })

      expect(getWorkout('1')).toEqual(mockWorkout)
    })

    it('getWorkout returns undefined when missing', async () => {
      const { getWorkout } = await import('./store')

      expect(getWorkout('missing')).toBeUndefined()
    })

    it('getWorkouts returns workouts list', async () => {
      const { getWorkouts } = await import('./store')
      useWorkoutStore.setState({ workouts: [mockWorkout] })

      expect(getWorkouts()).toEqual([mockWorkout])
    })

    it('create/update/delete delegates to store actions', async () => {
      const { createWorkout, updateWorkout, deleteWorkout } =
        await import('./store')
      const createSpy = vi
        .spyOn(useWorkoutStore.getState(), 'createWorkout')
        .mockResolvedValue(mockWorkout)
      const updateSpy = vi
        .spyOn(useWorkoutStore.getState(), 'updateWorkout')
        .mockResolvedValue(mockWorkout)
      const deleteSpy = vi
        .spyOn(useWorkoutStore.getState(), 'deleteWorkout')
        .mockResolvedValue(undefined)

      await createWorkout({ name: 'New', sets: [] })
      await updateWorkout('1', { name: 'Updated', sets: [] })
      await deleteWorkout('1')

      expect(createSpy).toHaveBeenCalled()
      expect(updateSpy).toHaveBeenCalled()
      expect(deleteSpy).toHaveBeenCalled()
    })
  })
})
