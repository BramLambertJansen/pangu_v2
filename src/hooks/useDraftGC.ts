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
        const { data } = await supabase
          .from(table as Parameters<typeof supabase.from>[0])
          .select('id')
          .eq(filterKey, filterValue)
          .eq('committed', false)
          .lt('created_at', cutoff)
        if (data?.length) {
          await supabase
            .from(table as Parameters<typeof supabase.from>[0])
            .delete()
            .in('id', data.map((r: { id: string }) => r.id))
        }
      } catch (err) {
        console.warn('[GC] draft cleanup failed:', err)
      }
    })()
  }, [user?.id, filterValue])
}
