import { create } from "zustand"
import { persist } from "zustand/middleware"

import { browserStorage } from "./browser-storage"

type UsageState = {
  /** Estimated credits for generations that completed through this app. */
  spent: number
  /** Estimates for requests still in flight, keyed by request id. */
  pending: Record<string, number>
  track: (requestId: string, credits: number) => void
  settle: (requestId: string, completed: boolean) => void
  reset: () => void
}

export const useUsage = create<UsageState>()(
  persist(
    (set) => ({
      spent: 0,
      pending: {},
      track: (requestId, credits) =>
        set((state) => ({
          pending: { ...state.pending, [requestId]: credits },
        })),
      settle: (requestId, completed) =>
        set((state) => {
          const credits = state.pending[requestId]
          if (credits === undefined) return state
          const nextPending = { ...state.pending }
          delete nextPending[requestId]
          return {
            pending: nextPending,
            spent: completed ? state.spent + credits : state.spent,
          }
        }),
      reset: () => set({ spent: 0, pending: {} }),
    }),
    { name: "studio-usage", storage: browserStorage() }
  )
)
