import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  fetchWorkouts,
  fetchWorkout,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  cloneWorkout,
  fetchPublicWorkouts,
  fetchPublicWorkout,
  fetchUserSettings,
  updateUserSettings,
} from './api'

const okJsonResponse = (payload: unknown) =>
  ({ ok: true, json: async () => payload }) as Response

const errorResponse = (payload: unknown) =>
  ({ ok: false, json: async () => payload }) as Response

describe('workout api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    global.fetch = vi.fn()
  })

  it('fetchWorkouts returns workouts', async () => {
    const workouts = [{ id: '1' }]
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workouts))

    await expect(fetchWorkouts()).resolves.toEqual(workouts)
    expect(fetch).toHaveBeenCalledWith('/api/workouts', { cache: 'no-store' })
  })

  it('fetchWorkouts throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(fetchWorkouts()).rejects.toThrow('Failed to fetch workouts')
  })

  it('fetchWorkout returns workout', async () => {
    const workout = { id: '1' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workout))

    await expect(fetchWorkout('1')).resolves.toEqual(workout)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/1', { cache: 'no-store' })
  })

  it('fetchWorkout throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(fetchWorkout('1')).rejects.toThrow('Failed to fetch workout')
  })

  it('createWorkout posts data and returns workout', async () => {
    const workout = { id: '1' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workout))

    const payload = { name: 'Test', sets: [] }
    await expect(createWorkout(payload)).resolves.toEqual(workout)
    expect(fetch).toHaveBeenCalledWith('/api/workouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('createWorkout throws with api error message', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({ error: 'Nope' }))

    await expect(createWorkout({ name: 'Test', sets: [] })).rejects.toThrow(
      'Nope'
    )
  })

  it('updateWorkout patches data and returns workout', async () => {
    const workout = { id: '1' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workout))

    const payload = { name: 'Update', sets: [] }
    await expect(updateWorkout('1', payload)).resolves.toEqual(workout)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  })

  it('updateWorkout throws with api error message', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({ error: 'Nope' }))

    await expect(
      updateWorkout('1', { name: 'Update', sets: [] })
    ).rejects.toThrow('Nope')
  })

  it('deleteWorkout returns true', async () => {
    vi.mocked(fetch).mockResolvedValue(okJsonResponse({}))

    await expect(deleteWorkout('1')).resolves.toBe(true)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/1', {
      method: 'DELETE',
    })
  })

  it('deleteWorkout throws with api error message', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({ error: 'Nope' }))

    await expect(deleteWorkout('1')).rejects.toThrow('Nope')
  })

  it('cloneWorkout posts and returns workout', async () => {
    const workout = { id: '1' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workout))

    await expect(cloneWorkout('1')).resolves.toEqual(workout)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/1/clone', {
      method: 'POST',
    })
  })

  it('cloneWorkout throws with api error message', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({ error: 'Nope' }))

    await expect(cloneWorkout('1')).rejects.toThrow('Nope')
  })

  it('fetchPublicWorkouts returns workouts', async () => {
    const workouts = [{ id: '1' }]
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workouts))

    await expect(fetchPublicWorkouts()).resolves.toEqual(workouts)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/public')
  })

  it('fetchPublicWorkouts throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(fetchPublicWorkouts()).rejects.toThrow(
      'Failed to fetch public workouts'
    )
  })

  it('fetchPublicWorkout returns workout', async () => {
    const workout = { id: '1' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(workout))

    await expect(fetchPublicWorkout('1')).resolves.toEqual(workout)
    expect(fetch).toHaveBeenCalledWith('/api/workouts/public/1')
  })

  it('fetchPublicWorkout throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(fetchPublicWorkout('1')).rejects.toThrow(
      'Failed to fetch public workout'
    )
  })

  it('fetchUserSettings returns settings', async () => {
    const settings = { theme: 'dark' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(settings))

    await expect(fetchUserSettings()).resolves.toEqual(settings)
    expect(fetch).toHaveBeenCalledWith('/api/settings')
  })

  it('fetchUserSettings throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(fetchUserSettings()).rejects.toThrow(
      'Failed to fetch settings'
    )
  })

  it('updateUserSettings patches settings', async () => {
    const settings = { theme: 'dark' }
    vi.mocked(fetch).mockResolvedValue(okJsonResponse(settings))

    await expect(updateUserSettings(settings)).resolves.toEqual(settings)
    expect(fetch).toHaveBeenCalledWith('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
  })

  it('updateUserSettings throws on error', async () => {
    vi.mocked(fetch).mockResolvedValue(errorResponse({}))

    await expect(updateUserSettings({})).rejects.toThrow(
      'Failed to update settings'
    )
  })
})
