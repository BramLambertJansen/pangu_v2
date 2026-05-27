import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

function getUserId(): string {
  try {
    const auth = JSON.parse(localStorage.getItem('auth') ?? '{}')
    return (auth?.state?.user?.id as string | undefined) ?? 'guest'
  } catch {
    return 'guest'
  }
}

interface SyncState {
  syncEnabled: boolean
  setSyncEnabled: (enabled: boolean) => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set) => ({
      syncEnabled: true,
      setSyncEnabled: (enabled) => set({ syncEnabled: enabled }),
    }),
    {
      name: 'sync',
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(`${name}:${getUserId()}`),
        setItem: (name, value) => localStorage.setItem(`${name}:${getUserId()}`, value),
        removeItem: (name) => localStorage.removeItem(`${name}:${getUserId()}`),
      })),
    },
  ),
)

/**
 * Returns the localStorage key used for the per-user TanStack Query cache.
 * Matches the key produced in App.tsx so callers can clear it consistently.
 */
export function getQueryCacheKey(): string {
  return `rq-cache:${getUserId()}`
}

/**
 * Non-reactive helper: reads sync state directly from localStorage.
 * Use outside React (e.g. in queryClient.ts).
 */
export function isSyncEnabled(): boolean {
  try {
    const userId = getUserId()
    const raw = localStorage.getItem(`sync:${userId}`)
    if (!raw) return true
    const parsed = JSON.parse(raw) as { state?: { syncEnabled?: boolean } }
    return parsed.state?.syncEnabled ?? true
  } catch {
    return true
  }
}
