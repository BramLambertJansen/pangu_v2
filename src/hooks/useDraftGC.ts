import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Deletes uncommitted draft rows older than 30 minutes for the given table + filter.
 * Runs once per mount when the user is authenticated and filterValue is set.
 */
export function useDraftGC(
  table: string,
  filterKey: string,
  filterValue: string | undefined,
) {
  const user = useAuthStore(s => s.user)

  useEffect(() => {
    if (!user?.id || !filterValue) return
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString()
    void (async () => {
      try {
        // Delete directly against the same predicates (no select-then-delete by id):
        // avoids both a TOCTOU race where a draft gets committed between select and
        // delete, and the implicit ~1000-row cap on a select-then-.in() round trip.
        await supabase
          .from(table as Parameters<typeof supabase.from>[0])
          .delete()
          .eq(filterKey, filterValue)
          .eq('committed', false)
          .lt('created_at', cutoff)
      } catch (err) {
        console.warn('[GC] draft cleanup failed:', err)
      }
    })()
  }, [user?.id, filterValue, filterKey, table])
}
