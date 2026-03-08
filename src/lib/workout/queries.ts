import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from './api'
import { Workout, WorkoutFormData } from './types'

export const workoutKeys = {
  all: ['workouts'] as const,
  detail: (id: string) => ['workouts', id] as const,
}

export function useWorkouts(initialData?: Workout[]) {
  return useQuery({
    queryKey: workoutKeys.all,
    queryFn: api.fetchWorkouts,
    initialData,
  })
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: workoutKeys.detail(id),
    queryFn: () => api.fetchWorkout(id),
  })
}

export function useCreateWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkoutFormData) => api.createWorkout(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useUpdateWorkout(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: WorkoutFormData) => api.updateWorkout(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(workoutKeys.detail(id), updated)
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.deleteWorkout(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: workoutKeys.all })
      const prev = queryClient.getQueryData<Workout[]>(workoutKeys.all)
      queryClient.setQueryData<Workout[]>(workoutKeys.all, (old) =>
        old ? old.filter((w) => w.id !== id) : []
      )
      return { prev }
    },
    onError: (_err, _id, context) => {
      queryClient.setQueryData(workoutKeys.all, context?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}

export function useCloneWorkout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.cloneWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workoutKeys.all })
    },
  })
}
