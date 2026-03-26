import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TimerState, Workout } from './types'
import { getNextPhaseInfo } from './transitions'

const COUNTDOWN_SECONDS = 3

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      workout: null,
      phase: 'idle',
      currentSetIndex: 0,
      currentExerciseIndex: 0,
      currentRepeat: 1,
      timeRemaining: 0,
      totalTimeElapsed: 0,
      isRunning: false,

      loadWorkout: (workout: Workout) => {
        set({
          workout,
          phase: 'idle',
          currentSetIndex: 0,
          currentExerciseIndex: 0,
          currentRepeat: 1,
          timeRemaining: 0,
          totalTimeElapsed: 0,
          isRunning: false,
        })
      },

      start: () => {
        const { workout } = get()
        if (!workout || workout.sets.length === 0) return

        set({
          phase: 'countdown',
          currentSetIndex: 0,
          currentExerciseIndex: 0,
          currentRepeat: 1,
          timeRemaining: COUNTDOWN_SECONDS,
          totalTimeElapsed: 0,
          isRunning: true,
        })
      },

      pause: () => set({ isRunning: false }),

      resume: () => set({ isRunning: true }),

      skip: () => {
        const {
          workout,
          currentSetIndex,
          currentExerciseIndex,
          currentRepeat,
          phase,
        } = get()
        if (!workout) return

        const next = getNextPhaseInfo(
          workout,
          currentSetIndex,
          currentExerciseIndex,
          currentRepeat,
          phase
        )
        if (next) {
          set({
            phase: next.phase,
            currentSetIndex: next.setIndex,
            currentExerciseIndex: next.exerciseIndex,
            currentRepeat: next.repeat,
            timeRemaining: next.time,
          })
        }
      },

      stop: () => {
        set({
          workout: null,
          phase: 'idle',
          currentSetIndex: 0,
          currentExerciseIndex: 0,
          currentRepeat: 1,
          timeRemaining: 0,
          isRunning: false,
        })
      },

      tick: () => {
        const {
          phase,
          timeRemaining,
          totalTimeElapsed,
          workout,
          currentSetIndex,
          currentExerciseIndex,
          currentRepeat,
        } = get()
        if (!workout || !get().isRunning) return

        if (timeRemaining <= 1) {
          const next = getNextPhaseInfo(
            workout,
            currentSetIndex,
            currentExerciseIndex,
            currentRepeat,
            phase
          )
          if (next) {
            set({
              phase: next.phase,
              currentSetIndex: next.setIndex,
              currentExerciseIndex: next.exerciseIndex,
              currentRepeat: next.repeat,
              timeRemaining: next.time,
              totalTimeElapsed:
                phase === 'countdown' ? totalTimeElapsed : totalTimeElapsed + 1,
              isRunning: next.phase !== 'complete',
            })
          }
        } else {
          set({
            timeRemaining: timeRemaining - 1,
            totalTimeElapsed:
              phase === 'countdown' ? totalTimeElapsed : totalTimeElapsed + 1,
          })
        }
      },
    }),
    {
      name: 'timer-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        workout: state.workout,
        phase: state.phase,
        currentSetIndex: state.currentSetIndex,
        currentExerciseIndex: state.currentExerciseIndex,
        currentRepeat: state.currentRepeat,
        timeRemaining: state.timeRemaining,
        totalTimeElapsed: state.totalTimeElapsed,
        // isRunning intentionally excluded — always restore as paused
      }),
    }
  )
)
