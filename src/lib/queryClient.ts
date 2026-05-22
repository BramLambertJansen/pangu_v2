import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,   // 5 min — reduces redundant Supabase round-trips
      gcTime: 10 * 60 * 1000,     // 10 min — keep inactive cache for back-navigation
    },
  },
})
