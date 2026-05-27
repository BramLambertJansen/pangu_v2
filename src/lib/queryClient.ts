import { QueryClient } from '@tanstack/react-query'

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
