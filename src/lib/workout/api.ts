import { Workout, WorkoutFormData } from './types'

export type { Workout, WorkoutFormData }

export async function fetchWorkouts(): Promise<Workout[]> {
  const response = await fetch('/api/workouts')
  if (!response.ok) {
    throw new Error('Failed to fetch workouts')
  }
  return response.json()
}

export async function fetchWorkout(id: string): Promise<Workout> {
  const response = await fetch(`/api/workouts/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch workout')
  }
  return response.json()
}

export async function createWorkout(data: WorkoutFormData): Promise<Workout> {
  const response = await fetch('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create workout')
  }
  return response.json()
}

export async function updateWorkout(
  id: string,
  data: WorkoutFormData
): Promise<Workout> {
  const response = await fetch(`/api/workouts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update workout')
  }
  return response.json()
}

export async function deleteWorkout(id: string): Promise<boolean> {
  const response = await fetch(`/api/workouts/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete workout')
  }
  return true
}

export async function cloneWorkout(id: string): Promise<Workout> {
  const response = await fetch(`/api/workouts/${id}/clone`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to clone workout')
  }
  return response.json()
}

export async function fetchPublicWorkouts(): Promise<Workout[]> {
  const response = await fetch('/api/workouts/public')
  if (!response.ok) {
    throw new Error('Failed to fetch public workouts')
  }
  return response.json()
}

export async function fetchPublicWorkout(id: string): Promise<Workout> {
  const response = await fetch(`/api/workouts/public/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch public workout')
  }
  return response.json()
}

export async function fetchUserSettings(): Promise<Record<string, unknown>> {
  const response = await fetch('/api/settings')
  if (!response.ok) {
    throw new Error('Failed to fetch settings')
  }
  return response.json()
}

export async function updateUserSettings(
  settings: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  })
  if (!response.ok) {
    throw new Error('Failed to update settings')
  }
  return response.json()
}
