import { QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { isSyncEnabled } from '@/stores/sync.store'

export class SyncDisabledError extends Error {
  readonly code = 'sync-disabled' as const
  constructor() {
    super('sync-disabled')
    this.name = 'SyncDisabledError'
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,    // 5 min — reduces redundant Supabase round-trips
      gcTime: 24 * 60 * 60 * 1000, // 24 h — must outlive the persisted cache maxAge
      networkMode: 'offlineFirst',  // serve from cache immediately; background-refetch when online
    },
    mutations: {
      onMutate: () => {
        if (!isSyncEnabled()) {
          toast.warning('Sync is uitgeschakeld — wijzigingen worden niet opgeslagen in de database.', {
            id: 'sync-disabled',
            duration: 4000,
          })
          throw new SyncDisabledError()
        }
      },
    },
  },
})
