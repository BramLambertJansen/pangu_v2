import { QueryClient } from '@tanstack/react-query'

export const STALE = {
  list:     30_000,        // list views: refresh frequently
  detail:   60_000,        // detail pages: 1 min
  slow:     5 * 60_000,    // settings, invites
  external: 60 * 60_000,   // third-party APIs (SRD)
} as const

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,    // 5 min — reduces redundant Supabase round-trips
      gcTime: 24 * 60 * 60 * 1000, // 24 h — must outlive the persisted cache maxAge
      networkMode: 'offlineFirst',  // serve from cache immediately; background-refetch when online
    },
  },
})
