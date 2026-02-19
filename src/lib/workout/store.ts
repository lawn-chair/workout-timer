import { Workout, WorkoutFormData } from './types'

export type { Workout, WorkoutFormData }

const STORAGE_KEY = 'workout-timer-workouts'

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export function getWorkouts(): Workout[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []
  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function getWorkout(id: string): Workout | undefined {
  return getWorkouts().find((w) => w.id === id)
}

export function createWorkout(data: WorkoutFormData): Workout {
  const workout: Workout = {
    id: generateId(),
    name: data.name,
    description: data.description,
    exercises: data.exercises.map((ex, index) => ({
      ...ex,
      id: generateId(),
      order: index,
    })),
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const workouts = getWorkouts()
  workouts.push(workout)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  return workout
}

export function updateWorkout(
  id: string,
  data: WorkoutFormData
): Workout | null {
  const workouts = getWorkouts()
  const index = workouts.findIndex((w) => w.id === id)
  if (index === -1) return null

  const workout: Workout = {
    ...workouts[index],
    name: data.name,
    description: data.description,
    exercises: data.exercises.map((ex, i) => ({
      name: ex.name,
      workDuration: ex.workDuration,
      restDuration: ex.restDuration,
      sets: ex.sets,
      restBetweenSets: ex.restBetweenSets,
      id: generateId(),
      order: i,
    })),
    updatedAt: new Date(),
  }
  workouts[index] = workout
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  return workout
}

export function deleteWorkout(id: string): boolean {
  const workouts = getWorkouts()
  const index = workouts.findIndex((w) => w.id === id)
  if (index === -1) return false

  workouts.splice(index, 1)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts))
  return true
}

export function seedSampleWorkouts() {
  const existing = getWorkouts()
  if (existing.length > 0) return

  const sampleWorkouts: Workout[] = [
    {
      id: generateId(),
      name: 'Quick HIIT',
      description: 'A fast 15-minute HIIT session',
      exercises: [
        {
          id: generateId(),
          name: 'Jumping Jacks',
          workDuration: 30,
          restDuration: 10,
          sets: 3,
          restBetweenSets: 30,
          order: 0,
        },
        {
          id: generateId(),
          name: 'Squats',
          workDuration: 30,
          restDuration: 10,
          sets: 3,
          restBetweenSets: 30,
          order: 1,
        },
        {
          id: generateId(),
          name: 'Push-ups',
          workDuration: 30,
          restDuration: 10,
          sets: 3,
          restBetweenSets: 0,
          order: 2,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: generateId(),
      name: 'Tabata Basics',
      description: 'Classic 20/10 Tabata protocol',
      exercises: [
        {
          id: generateId(),
          name: 'Burpees',
          workDuration: 20,
          restDuration: 10,
          sets: 8,
          restBetweenSets: 0,
          order: 0,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleWorkouts))
}
