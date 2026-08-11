import { z } from 'zod'

const ExerciseInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Exercise name required')
    .max(100, 'Exercise name too long'),
  workDuration: z
    .number()
    .int()
    .min(1, 'Duration must be at least 1 second')
    .max(3600, 'Duration cannot exceed 1 hour'),
})

const SetInputSchema = z.object({
  repeatCount: z
    .number()
    .int()
    .min(1, 'Repeat count must be at least 1')
    .max(100, 'Repeat count cannot exceed 100'),
  restBetweenExercises: z
    .number()
    .int()
    .min(0, 'Rest cannot be negative')
    .max(3600, 'Rest cannot exceed 1 hour'),
  restBetweenRepeats: z
    .number()
    .int()
    .min(0, 'Rest cannot be negative')
    .max(3600, 'Rest cannot exceed 1 hour'),
  restBetweenSets: z
    .number()
    .int()
    .min(0, 'Rest cannot be negative')
    .max(3600, 'Rest cannot exceed 1 hour'),
  exercises: z
    .array(ExerciseInputSchema)
    .min(1, 'Each set must have at least one exercise')
    .max(50, 'Too many exercises in set'),
})

export const WorkoutInputSchema = z.object({
  name: z
    .string()
    .min(1, 'Workout name required')
    .max(100, 'Workout name too long'),
  description: z
    .string()
    .max(500, 'Description too long')
    .nullable()
    .optional(),
  isPublic: z.boolean().optional(),
  tags: z.array(z.string().max(50)).max(20, 'Too many tags').optional(),
  sets: z
    .array(SetInputSchema)
    .min(1, 'At least one set required')
    .max(100, 'Too many sets'),
})

export type WorkoutInput = z.infer<typeof WorkoutInputSchema>

export function validateWorkoutInput(
  data: unknown
):
  | { success: true; data: WorkoutInput }
  | { success: false; errors: Record<string, string> } {
  const result = WorkoutInputSchema.safeParse(data)
  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((err) => {
      const path = err.path.join('.')
      errors[path] = err.message
    })
    return { success: false, errors }
  }
  return { success: true, data: result.data }
}
