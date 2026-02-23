'use client'

import type { Dispatch, SetStateAction } from 'react'
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  addExercise,
  addSet,
  removeExercise,
  removeSet,
  reorderExercisesById,
  reorderSetsById,
  SetDraft,
  updateExerciseField,
  updateSetField,
} from '@/lib/workout/builder'

interface WorkoutBuilderSetsProps {
  sets: SetDraft[]
  onSetsChange: Dispatch<SetStateAction<SetDraft[]>>
}

export default function WorkoutBuilderSets({
  sets,
  onSetsChange,
}: WorkoutBuilderSetsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeType = active.data.current?.type

    if (activeType === 'set') {
      onSetsChange((current) =>
        reorderSetsById(current, String(active.id), String(over.id))
      )
      return
    }

    if (activeType === 'exercise') {
      const activeSetId = active.data.current?.setId
      const overSetId = over.data.current?.setId
      if (!activeSetId || activeSetId !== overSetId) return
      onSetsChange((current) =>
        reorderExercisesById(
          current,
          String(activeSetId),
          String(active.id),
          String(over.id)
        )
      )
    }
  }

  const handleAddSet = () => {
    onSetsChange((current) => addSet(current))
  }

  const handleRemoveSet = (index: number) => {
    onSetsChange((current) => removeSet(current, index))
  }

  const handleUpdateSet = (
    index: number,
    field: 'repeatCount' | 'restBetweenExercises' | 'restBetweenSets',
    value: number
  ) => {
    onSetsChange((current) => updateSetField(current, index, field, value))
  }

  const handleAddExercise = (setIndex: number) => {
    onSetsChange((current) => addExercise(current, setIndex))
  }

  const handleRemoveExercise = (setIndex: number, exerciseIndex: number) => {
    onSetsChange((current) => removeExercise(current, setIndex, exerciseIndex))
  }

  const handleUpdateExercise = (
    setIndex: number,
    exerciseIndex: number,
    field: 'name' | 'workDuration',
    value: string | number
  ) => {
    onSetsChange((current) =>
      updateExerciseField(current, setIndex, exerciseIndex, field, value)
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">Sets</h2>
          <p className="text-xs text-gray-400">
            Organize the workout into repeatable blocks.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddSet}
          className="lime-button px-4 py-2 rounded-full text-xs"
          data-testid="add-set-button"
        >
          + Add Set
        </button>
      </div>

      {sets.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No sets yet. Click &quot;Add Set&quot; to get started.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sets.map((set) => set.clientId)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4">
              {sets.map((set, setIndex) => (
                <SortableSetCard
                  key={set.clientId}
                  set={set}
                  setIndex={setIndex}
                  setCount={sets.length}
                  onRemove={handleRemoveSet}
                  onUpdate={handleUpdateSet}
                  onAddExercise={handleAddExercise}
                  onRemoveExercise={handleRemoveExercise}
                  onUpdateExercise={handleUpdateExercise}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

interface SortableSetCardProps {
  set: SetDraft
  setIndex: number
  setCount: number
  onRemove: (index: number) => void
  onUpdate: (
    index: number,
    field: 'repeatCount' | 'restBetweenExercises' | 'restBetweenSets',
    value: number
  ) => void
  onAddExercise: (setIndex: number) => void
  onRemoveExercise: (setIndex: number, exerciseIndex: number) => void
  onUpdateExercise: (
    setIndex: number,
    exerciseIndex: number,
    field: 'name' | 'workDuration',
    value: string | number
  ) => void
}

function SortableSetCard({
  set,
  setIndex,
  setCount,
  onRemove,
  onUpdate,
  onAddExercise,
  onRemoveExercise,
  onUpdateExercise,
}: SortableSetCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: set.clientId, data: { type: 'set' } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-sortable-id={set.clientId}
      data-sortable-type="set"
      data-set-id={set.clientId}
      className={`track-card rounded-2xl p-5 ${isDragging ? 'opacity-80' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="ghost-button h-9 w-9 rounded-full flex items-center justify-center text-sm"
            aria-label="Reorder set"
            data-testid={`set-drag-handle-${setIndex}`}
            {...attributes}
            {...listeners}
          >
            :::
          </button>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Set {setIndex + 1}
          </span>
        </div>
        {setCount > 1 && (
          <button
            type="button"
            onClick={() => onRemove(setIndex)}
            className="text-red-300 hover:text-red-200 text-xs"
            data-testid={`remove-set-button-${setIndex}`}
          >
            Remove Set
          </button>
        )}
      </div>

      <div className="grid gap-3 mb-4 md:grid-cols-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Repeat Count
          </label>
          <input
            type="number"
            value={set.repeatCount}
            onChange={(e) =>
              onUpdate(setIndex, 'repeatCount', parseInt(e.target.value) || 1)
            }
            min={1}
            className="w-full input-field rounded-lg px-3 py-2"
            data-testid={`set-repeat-input-${setIndex}`}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Rest Between Exercises
          </label>
          <input
            type="number"
            value={set.restBetweenExercises}
            onChange={(e) =>
              onUpdate(
                setIndex,
                'restBetweenExercises',
                parseInt(e.target.value) || 0
              )
            }
            min={0}
            className="w-full input-field rounded-lg px-3 py-2"
            data-testid={`rest-between-exercises-input-${setIndex}`}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Rest Between Sets
          </label>
          <input
            type="number"
            value={set.restBetweenSets}
            onChange={(e) =>
              onUpdate(
                setIndex,
                'restBetweenSets',
                parseInt(e.target.value) || 0
              )
            }
            min={0}
            className="w-full input-field rounded-lg px-3 py-2"
            data-testid={`rest-between-sets-input-${setIndex}`}
          />
        </div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold">Exercises</h3>
        <button
          type="button"
          onClick={() => onAddExercise(setIndex)}
          className="ghost-button px-3 py-1.5 rounded-full text-xs"
          data-testid={`add-exercise-button-${setIndex}`}
        >
          + Add Exercise
        </button>
      </div>

      {set.exercises.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          No exercises yet. Click &quot;Add Exercise&quot; to get started.
        </p>
      ) : (
        <SortableContext
          items={set.exercises.map((exercise) => exercise.clientId)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {set.exercises.map((exercise, exerciseIndex) => (
              <SortableExerciseCard
                key={exercise.clientId}
                exercise={exercise}
                exerciseIndex={exerciseIndex}
                setIndex={setIndex}
                setId={set.clientId}
                exerciseCount={set.exercises.length}
                onRemove={onRemoveExercise}
                onUpdate={onUpdateExercise}
              />
            ))}
          </div>
        </SortableContext>
      )}
    </div>
  )
}

interface SortableExerciseCardProps {
  exercise: SetDraft['exercises'][number]
  exerciseIndex: number
  exerciseCount: number
  setIndex: number
  setId: string
  onRemove: (setIndex: number, exerciseIndex: number) => void
  onUpdate: (
    setIndex: number,
    exerciseIndex: number,
    field: 'name' | 'workDuration',
    value: string | number
  ) => void
}

function SortableExerciseCard({
  exercise,
  exerciseIndex,
  exerciseCount,
  setIndex,
  setId,
  onRemove,
  onUpdate,
}: SortableExerciseCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.clientId,
    data: { type: 'exercise', setId },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-sortable-id={exercise.clientId}
      data-sortable-type="exercise"
      data-exercise-id={exercise.clientId}
      data-set-id={setId}
      className={`bg-black/40 rounded-xl p-4 border border-white/5 ${
        isDragging ? 'opacity-80' : ''
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <button
            ref={setActivatorNodeRef}
            type="button"
            className="ghost-button h-8 w-8 rounded-full flex items-center justify-center text-xs"
            aria-label="Reorder exercise"
            data-testid={`exercise-drag-handle-${setIndex}-${exerciseIndex}`}
            {...attributes}
            {...listeners}
          >
            :::
          </button>
          <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Exercise {exerciseIndex + 1}
          </span>
        </div>
        {exerciseCount > 1 && (
          <button
            type="button"
            onClick={() => onRemove(setIndex, exerciseIndex)}
            className="text-red-300 hover:text-red-200 text-xs"
            data-testid={`remove-exercise-button-${setIndex}-${exerciseIndex}`}
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name</label>
          <input
            type="text"
            value={exercise.name}
            onChange={(e) =>
              onUpdate(setIndex, exerciseIndex, 'name', e.target.value)
            }
            placeholder="e.g., Jumping Jacks"
            className="w-full input-field rounded-lg px-3 py-2 placeholder-gray-600"
            required
            data-testid={`exercise-name-input-${setIndex}-${exerciseIndex}`}
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Work (seconds)
          </label>
          <input
            type="number"
            value={exercise.workDuration}
            onChange={(e) =>
              onUpdate(
                setIndex,
                exerciseIndex,
                'workDuration',
                parseInt(e.target.value) || 0
              )
            }
            min={1}
            className="w-full input-field rounded-lg px-3 py-2"
            data-testid={`exercise-work-input-${setIndex}-${exerciseIndex}`}
          />
        </div>
      </div>
    </div>
  )
}
