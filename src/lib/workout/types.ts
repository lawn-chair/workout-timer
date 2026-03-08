export interface SetExercise {
  id: string
  name: string
  workDuration: number
  order: number
}

export interface WorkoutSet {
  id: string
  order: number
  repeatCount: number
  restBetweenExercises: number
  restBetweenSets: number
  exercises: SetExercise[]
}

export interface Workout {
  id: string
  name: string
  description?: string
  slug?: string
  tags?: string[]
  isPublic?: boolean
  sets: WorkoutSet[]
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutFormData {
  name: string
  description?: string
  isPublic?: boolean
  tags?: string[]
  sets: {
    repeatCount: number
    restBetweenExercises: number
    restBetweenSets: number
    exercises: {
      name: string
      workDuration: number
    }[]
  }[]
}
