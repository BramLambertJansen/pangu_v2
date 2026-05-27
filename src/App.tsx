import { useMemo } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { router } from '@/routes'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AuthInitializer } from '@/components/AuthInitializer'
import { useAuthStore } from '@/stores/auth.store'
import { DEV_MODE } from '@/lib/constants'
import { localDb } from '@/lib/localDb'

const CACHE_MAX_AGE = 24 * 60 * 60 * 1000 // 24 h — aligns with gcTime in queryClient

// Detect transition from DEV_MODE=true → false and wipe all local dev data.
// Runs once at module load, before any React rendering.
const WAS_DEV_MODE_KEY = 'pangu-dev-mode'
if (!DEV_MODE) {
  if (localStorage.getItem(WAS_DEV_MODE_KEY) === 'true') {
    localStorage.removeItem(WAS_DEV_MODE_KEY)
    localDb.clearAll()
    Object.keys(localStorage)
      .filter((k) => k.startsWith('rq-cache:'))
      .forEach((k) => localStorage.removeItem(k))
  }
} else {
  localStorage.setItem(WAS_DEV_MODE_KEY, 'true')
}

function AppInner() {
  const userId = useAuthStore(s => s.user?.id ?? 'guest')

  // Recreate persister when the authenticated user changes so each user
  // gets their own isolated cache key in localStorage.
  const persister = useMemo(
    () =>
      createSyncStoragePersister({
        storage: window.localStorage,
        key: `rq-cache:${userId}`,
        throttleTime: 1000, // write at most once per second
      }),
    [userId],
  )

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: CACHE_MAX_AGE }}
    >
      <AuthInitializer />
      <RouterProvider router={router} />
      <Toaster richColors position="top-right" />
    </PersistQueryClientProvider>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  )
}
