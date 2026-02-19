import { create } from 'zustand'
import { Workout, WorkoutFormData } from './types'
import * as api from './api'

interface WorkoutState {
  workouts: Workout[]
  currentWorkout: Workout | null
  isLoading: boolean
  error: string | null

  fetchWorkouts: () => Promise<void>
  fetchWorkout: (id: string) => Promise<void>
  createWorkout: (data: WorkoutFormData) => Promise<Workout>
  updateWorkout: (id: string, data: WorkoutFormData) => Promise<Workout>
  deleteWorkout: (id: string) => Promise<void>
  cloneWorkout: (id: string) => Promise<Workout>
  setCurrentWorkout: (workout: Workout | null) => void
  clearError: () => void
}

export const useWorkoutStore = create<WorkoutState>((set) => ({
  workouts: [],
  currentWorkout: null,
  isLoading: false,
  error: null,

  fetchWorkouts: async () => {
    set({ isLoading: true, error: null })
    try {
      const workouts = await api.fetchWorkouts()
      set({ workouts, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  fetchWorkout: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const workout = await api.fetchWorkout(id)
      set({ currentWorkout: workout, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  createWorkout: async (data: WorkoutFormData) => {
    set({ isLoading: true, error: null })
    try {
      const workout = await api.createWorkout(data)
      set((state) => ({
        workouts: [workout, ...state.workouts],
        isLoading: false,
      }))
      return workout
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  updateWorkout: async (id: string, data: WorkoutFormData) => {
    set({ isLoading: true, error: null })
    try {
      const workout = await api.updateWorkout(id, data)
      set((state) => ({
        workouts: state.workouts.map((w) => (w.id === id ? workout : w)),
        currentWorkout: workout,
        isLoading: false,
      }))
      return workout
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  deleteWorkout: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      await api.deleteWorkout(id)
      set((state) => ({
        workouts: state.workouts.filter((w) => w.id !== id),
        isLoading: false,
      }))
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  cloneWorkout: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const workout = await api.cloneWorkout(id)
      set((state) => ({
        workouts: [workout, ...state.workouts],
        isLoading: false,
      }))
      return workout
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
      throw error
    }
  },

  setCurrentWorkout: (workout: Workout | null) => {
    set({ currentWorkout: workout })
  },

  clearError: () => {
    set({ error: null })
  },
}))

export type { Workout, WorkoutFormData }

export const getWorkouts = () => useWorkoutStore.getState().workouts
export const getWorkout = (id: string) =>
  useWorkoutStore.getState().workouts.find((w) => w.id === id)
export const createWorkout = (data: WorkoutFormData) =>
  useWorkoutStore.getState().createWorkout(data)
export const updateWorkout = (id: string, data: WorkoutFormData) =>
  useWorkoutStore.getState().updateWorkout(id, data)
export const deleteWorkout = (id: string) =>
  useWorkoutStore.getState().deleteWorkout(id)

export function seedSampleWorkouts() {}
