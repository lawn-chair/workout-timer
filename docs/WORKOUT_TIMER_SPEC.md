# Workout Timer Application - Specification

## Core Features

### 1. Workout Management

- **Create/Edit Workouts**: Name, description, exercises
- **Exercise Structure**: Each exercise has:
  - Name
  - Duration (work time)
  - Rest time (before next exercise)
  - Sets (number of repetitions)
  - Rest between sets
- **Delete/Clone Workouts**
- **Workout Categories/Tags** (optional)

### 2. Timer Interface

- **Large Display**: Current exercise name, time remaining
- **Visual Cues**: Color changes (work vs rest), progress bar
- **Controls**: Play, Pause, Skip, Stop
- **Audio Cues**:
  - 3-2-1 countdown beeps
  - Distinct sound for work start vs rest start
  - Workout complete chime
- **Current Progress**: Set #, Exercise #, Total time

### 3. Multi-Device Support

- **Responsive Design**: Mobile-first
- **PWA**: Installable, works offline
- **Orientation**: Portrait optimized, landscape supported
- **Touch-friendly**: Large buttons, swipe gestures

### 4. Data & Sync

- **Backend**: User accounts, cloud sync
- **Offline Support**: Local cache, sync when online
- **Share Workouts**: Generate shareable links

---

## Technical Stack

- **Frontend**: Next.js + TypeScript + Tailwind CSS
- **State Management**: React Context / Zustand
- **Audio**: Web Audio API / Howler.js
- **Backend**: Next.js API routes + database (Prisma + SQLite/PostgreSQL)
- **Auth**: NextAuth.js
- **PWA**: next-pwa

---

## Page Structure

1. **Home/Dashboard** - List of saved workouts, quick start
2. **Workout Builder** - Create/edit workout with drag-drop exercises
3. **Timer** - Full-screen timer interface
4. **Settings** - Audio preferences, account settings
5. **History** - Past workout sessions (optional)

---

## Data Models

### Workout

```
- id
- name
- description
- exercises[] (ordered)
- createdAt
- updatedAt
```

### Exercise

```
- id
- name
- workDuration (seconds)
- restDuration (seconds)
- sets (number)
- restBetweenSets (seconds)
```

### User

```
- id
- email
- name
- workouts[]
- settings
```

---

## Timer Flow

1. Select workout → Preview summary
2. Press Start → 3-second countdown
3. For each set:
   - Work phase (exercise name, countdown)
   - Rest phase (next exercise preview)
   - Repeat for sets
4. Rest between sets (if > 0)
5. Workout complete → Summary screen

---

## UI States

| State     | Background | Timer Color | Sound          |
| --------- | ---------- | ----------- | -------------- |
| Countdown | Yellow     | White       | Beep beep beep |
| Work      | Green      | White       | Start chime    |
| Rest      | Red        | White       | Rest chime     |
| Paused    | Gray       | Yellow      | -              |
| Complete  | Blue       | White       | Celebration    |

---

## Priority Order

1. **Phase 1**: Timer core (display, controls, audio)
2. **Phase 2**: Workout CRUD (create, save, load)
3. **Phase 3**: User accounts & sync
4. **Phase 4**: History & analytics
5. **Phase 5**: Polish (themes, gestures, PWA)

---

## Testing

- **Unit Tests**: Vitest for business logic, stores, utilities
- **Component Tests**: React Testing Library for UI components
- **E2E Tests**: Playwright for full-page flows
  - Home page: workout list, create, delete
  - Workout builder: create workout with exercises
  - Edit workout: load and update workout
  - Timer: start, pause, resume, complete workout
  - Dynamic routes: verify params are handled correctly

---

## Open Questions

- [ ] Voice announcements (e.g., "Rest", "Go")?
- [ ] Custom exercise images/icons?
- [ ] Pre-built workout templates?
- [ ] Dark/light theme?
