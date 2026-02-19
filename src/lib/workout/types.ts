export interface Exercise {
  id: string
  name: string
  workDuration: number
  restDuration: number
  sets: number
  restBetweenSets: number
  order: number
}

export interface Workout {
  id: string
  name: string
  description?: string
  exercises: Exercise[]
  createdAt: Date
  updatedAt: Date
}

export interface WorkoutFormData {
  name: string
  description?: string
  exercises: {
    name: string
    workDuration: number
    restDuration: number
    sets: number
    restBetweenSets: number
  }[]
}
