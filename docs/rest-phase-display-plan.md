# Rest Phase Display Improvements

## Problem

Currently during rest phases, the "Up Next" display shows "Repeat set X" instead of the actual exercise name.

## Current Behavior

- During rest when the next item is a repeat, displays: "Up Next: Repeat set 2"
- Bottom label also shows redundant "Next: Repeat set 2"

## Desired Behavior

- Main display shows: "Up Next: [exercise name]" (e.g., "Up Next: Push-ups")
- Bottom label (with elapsed time and progress bar) should NOT show any "Next:" label during rest phases

## Changes Needed

### 1. `src/components/timer/TimerDisplay.tsx`

#### Hide bottom "Next:" label during rest phases

In the bottom section (around line 262-264), conditionally hide the `nextUpLabel` span when phase is `rest` or `restBetweenSets`:

```tsx
{
  /* Current: */
}
;<span>{nextUpLabel}</span>

{
  /* Change to: */
}
{
  phase !== 'rest' && phase !== 'restBetweenSets' && <span>{nextUpLabel}</span>
}
```

#### Fix "Repeat set X" to show exercise name

In `getDisplayedExercise()` function (around line 132):

```tsx
// Current:
name: `Repeat set ${currentRepeat + 1}`,

// Change to:
name: currentExercise?.name || 'Exercise',
```

In `getNextUpLabel()` function (around line 51):

```tsx
// Current:
return `Next: Repeat set ${currentRepeat + 1}`

// Change to show exercise name instead
const firstExercise = currentSet.exercises[0]
return `Next: ${firstExercise?.name || 'Exercise'}`
```

### 2. `src/components/timer/TimerDisplay.test.tsx`

Update the test at line 340 that currently expects "Up Next: Repeat set 2":

```tsx
// Current:
expect(screen.getByText('Up Next: Repeat set 2')).toBeInTheDocument()

// Change to expect exercise name:
expect(screen.getByText('Up Next: Push-ups')).toBeInTheDocument()
```

## Expected Result

During rest phase:

- Main display: "Up Next: Push-ups"
- Bottom area: Only shows elapsed time and progress bar (no "Next:" text)
