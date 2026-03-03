# Workout Timer Application - Specification

## Overview

Workout Timer is a Next.js app for building interval workouts and running them in a guided timer experience. Users can create workouts with sets and exercises, configure rest rules, run a live timer with audio cues, and share public workouts that others can view and clone.

## Core Features (Current)

### 1. Workout Management

- **Create/Edit Workouts**: Name, description, tags, public visibility
- **Workout Structure**:
  - Sets define repeat count, rest between exercises, and rest between sets
  - Exercises define name and work duration (seconds)
- **Drag-and-Drop Builder**: Reorder sets and exercises visually within sets
- **Delete Workouts**
- **Clone Public Workouts** into a user account
- **Browse Public Workouts** and deep-link via slug

### 2. Timer Interface

- **Large Display**: Current exercise, phase label, time remaining
- **Phases**: Countdown, work, rest, rest between repeats, rest between sets, complete
- **Controls**: Start, Pause/Resume, Skip, Stop
- **Audio Cues**:
  - 3-2-1 countdown beeps
  - Work start chime
  - Rest start chime (including between sets and between repeats)
  - Workout complete chime
- **Progress**: Set #, repeat #, exercise #, total time elapsed
- **Screen Wake Lock**: Keeps screen on during active workout

### 3. Accounts & Settings

- **Auth**: NextAuth with Google OAuth in production
- **Dev Auth**: Credentials provider for development and testing
- **Settings**: Audio preferences (countdown, work/rest start, completion)

### 4. PWA Support

- **Installable**: Web app manifest for installation
- **Icons**: Multiple sizes for different devices
- **Theme**: Consistent dark theme colors

### 5. Theme & Accessibility

- **Theme Modes**: Dark, Light, or System preference
- **Accessibility Presets**: Default, High Contrast, Large Text
- **Reduced Motion**: Respects `prefers-reduced-motion`

---

## Technical Stack

- **Frontend**: Next.js App Router + TypeScript + Tailwind CSS
- **State Management**: Zustand stores and hooks
- **Audio**: Web Audio API (tone generation)
- **Backend**: Next.js API routes + Prisma + SQLite
- **Auth**: NextAuth
- **Testing**: Vitest, React Testing Library, Playwright

---

## Page Structure (Current)

1. **Home/Dashboard** (`/`) - List of saved workouts and public browse toggle
2. **Workout Builder** (`/workouts/new`, `/workouts/[id]/edit`) - Create/edit workouts
3. **Timer** (`/timer`) - Full-screen timer interface
4. **Settings** (`/settings`) - Audio preferences and account info
5. **Public Workout** (`/w/[slug]`) - Public detail + start/clone
6. **Login** (`/login`) - Auth entry point

---

## Data Models (Current)

### User

```
- id
- email
- name
- settings (JSON)
- workouts[]
- createdAt
- updatedAt
```

### Workout

```
- id
- name
- description
- slug (unique)
- tags (comma-separated string)
- isPublic
- sets[] (ordered)
- userId
- createdAt
- updatedAt
```

### WorkoutSet

```
- id
- order
- repeatCount
- restBetweenExercises
- restBetweenSets
- exercises[] (ordered)
- workoutId
```

### SetExercise

```
- id
- name
- workDuration (seconds)
- order
- setId
```

---

## Timer Flow (Current)

1. User selects a workout on the home page or public detail page
2. Timer screen loads and waits in `idle`
3. Start triggers a 3-second countdown
4. For each set:
   - For each repeat of the set:
     - Work phase for each exercise
     - Rest phase between exercises (if configured)
     - Rest phase between repeats (if configured, uses restBetweenExercises)
   - Rest between sets (if configured)
   - If no rest between sets but rest between exercises configured, apply restBetweenExercises before next set
5. Final completion screen with action to return home

---

## UI States (Current)

| State                | Background | Sound            |
| -------------------- | ---------- | ---------------- |
| Countdown            | Yellow     | Countdown beeps  |
| Work                 | Green      | Work start chime |
| Rest                 | Red        | Rest start chime |
| Rest Between Sets    | Orange     | Rest start chime |
| Rest Between Repeats | Orange     | Rest start chime |
| Complete             | Blue       | Completion chime |
| Idle                 | Dark gray  | -                |

---

## Testing

- **Unit Tests**: Vitest for stores, timer logic, and utilities
- **Component Tests**: React Testing Library for UI components
- **E2E Tests**: Playwright for full-page flows
  - Home page: workout list, create, delete
  - Workout builder: create workout with exercises
  - Edit workout: load and update workout
  - Timer: start, pause, resume, complete workout
  - Dynamic routes: public workout view

---

## Future Ideas / Roadmap

- **Workout History**: Completed session history and analytics
- **Workout Templates**: Pre-built routines and sharing
- **Voice Announcements**: Spoken phase cues
- **Custom Media**: Exercise images or icons
