import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { WorldCard, ForgeWorldCard } from '@/components/world/WorldCard'
import type { World } from '@/types/world.types'

export default function WorldsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const { data: worlds, isLoading } = useQuery<World[]>({
    queryKey: queryKeys.worlds.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as World[]
    },
    staleTime: 1000 * 60,
  })

  const createWorld = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('worlds')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      navigate(`/worlds/${id}/edit`, { state: { isNew: true } })
    },
    onError: () => {
      toast.error('Wereld aanmaken mislukt')
    },
  })

  function handleCreate() {
    toast.promise(createWorld.mutateAsync(), {
      loading: 'Wereld aanmaken...',
      success: 'Wereld aangemaakt',
      error: 'Aanmaken mislukt',
    })
  }

  return (
    <div>
      {/* Page header */}
      <header style={{ marginBottom: 48 }}>
        <p className="pangu-eyebrow">De wieg van elk verhaal</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <h1 className="pangu-display-xl">Werelden</h1>
          <button
            type="button"
            className="pangu-btn pangu-btn-primary"
            onClick={handleCreate}
            disabled={createWorld.isPending}
            aria-label="Creëer een nieuwe wereld"
            style={{ marginBottom: 8, flexShrink: 0 }}
          >
            {createWorld.isPending ? 'Aanmaken...' : '+ Nieuwe wereld'}
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 15, color: 'var(--ink-soft)', maxWidth: 560, lineHeight: 1.65 }}>
          Een wereld is waar alles leeft — de steden, de verlaten wegen, de mensen en de monsters. Kies er één om te betreden.
        </p>
      </header>

      {/* Grid */}
      {isLoading ? (
        <ul
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)', listStyle: 'none', padding: 0, margin: 0 }}
          aria-label="Werelden laden..."
          aria-live="polite"
        >
          <EntityCardSkeleton count={3} variant="hero" />
        </ul>
      ) : (
        <>
          {/* Section divider */}
          {(worlds?.length ?? 0) > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 36 }} aria-hidden="true">
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--hairline-strong))' }} />
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                padding: '7px 18px',
                border: '1px solid var(--hairline-strong)',
                borderRadius: 'var(--r-full)',
                background: 'var(--void-2)',
                flexShrink: 0,
              }}>
                <span style={{ color: 'var(--gold)', fontSize: 9 }}>✦</span>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)',
                }}>
                  Bekende werelden
                </span>
                <span style={{ color: 'var(--gold)', fontSize: 9 }}>✦</span>
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--hairline-strong))' }} />
            </div>
          )}

          {/* Grid */}
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--sp-5)',
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}
            role="list"
            aria-label="Overzicht werelden"
          >
            {worlds?.map((world) => (
              <li key={world.id}>
                <WorldCard world={world} />
              </li>
            ))}
            <li>
              <ForgeWorldCard onClick={handleCreate} loading={createWorld.isPending} />
            </li>
          </ul>
        </>
      )}
    </div>
  )
}
