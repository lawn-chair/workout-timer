# Plan: Drag-and-Drop Workout Builder

## Goal

Allow users to reorder sets and exercises inside the workout builder using
drag-and-drop. Keep the first release scoped to reordering within a set only.

## Scope

- Reorder sets in the builder.
- Reorder exercises within a set.
- Drag handles only (no drag-anywhere).
- Preserve existing data shape for save/update.

## Approach

1. Introduce stable client IDs for sets and exercises in local state.
2. Add a shared `arrayMove` helper with unit tests.
3. Implement set-level drag-and-drop with `@dnd-kit`.
4. Implement exercise drag-and-drop within each set.
5. Add component tests for reordering.

## Future Enhancements

- Cross-set exercise moves.
- Keyboard reordering and accessibility refinements.
- Drag-to-create, auto-scroll, and multi-select.

## Tests

- Unit: array move helper.
- Component: reorder sets and exercises.
- `npm run check`.
