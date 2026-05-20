import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { WorldCard } from '@/components/world/WorldCard'
import type { World } from '@/types/world.types'

export default function WorldsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

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
      navigate(`/worlds/${id}`)
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
      <header style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p className="pangu-eyebrow">Overzicht</p>
            <h1 className="pangu-display-xl">Mijn Werelden</h1>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
              Jouw speelwerelden en campagnes.
            </p>
          </div>
          <button
            type="button"
            className="pangu-btn pangu-btn-primary"
            onClick={handleCreate}
            disabled={createWorld.isPending}
            aria-label="Creëer een nieuwe wereld"
            style={{ marginTop: 8 }}
          >
            {createWorld.isPending ? 'Aanmaken...' : '+ Creëer een wereld'}
          </button>
        </div>
      </header>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Werelden laden...">
          <Spinner size="lg" />
        </div>
      ) : worlds && worlds.length > 0 ? (
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 'var(--sp-5)',
            listStyle: 'none',
            padding: 0,
            margin: 0,
          }}
          role="list"
          aria-label="Overzicht werelden"
        >
          {worlds.map((world) => (
            <li key={world.id}>
              <WorldCard world={world} />
            </li>
          ))}
        </ul>
      ) : (
        <div
          className="pangu-surface-glow"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '80px 32px',
            textAlign: 'center',
          }}
          aria-live="polite"
        >
          <svg
            aria-hidden="true"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--subtle)', marginBottom: 20 }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            letterSpacing: '0.1em',
            color: 'var(--ink-soft)',
            margin: '0 0 8px',
          }}>
            Geen werelden gevonden
          </p>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 28 }}>
            Maak je eerste wereld aan om te beginnen.
          </p>
          <button
            type="button"
            className="pangu-btn pangu-btn-primary"
            onClick={handleCreate}
            disabled={createWorld.isPending}
          >
            {createWorld.isPending ? 'Aanmaken...' : '+ Creëer een wereld'}
          </button>
        </div>
      )}
    </div>
  )
}
