import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
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
      const newId = crypto.randomUUID()
      const { error } = await supabase
        .from('worlds')
        .insert({ id: newId, owner_id: user.id })
      if (error) throw error
      return newId
    },
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      navigate(`/worlds/${newId}`)
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
    <section aria-labelledby="worlds-heading" style={{ padding: 'var(--sp-8) var(--sp-6)' }}>
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            id="worlds-heading"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            MIJN WERELDEN
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            Jouw speelwerelden en campagnes
          </p>
        </div>
        <Button
          onClick={handleCreate}
          loading={createWorld.isPending}
          aria-label="Creëer een nieuwe wereld"
        >
          Creëer een wereld
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20" aria-live="polite" aria-label="Werelden laden...">
          <Spinner size="lg" />
        </div>
      ) : worlds && worlds.length > 0 ? (
        <ul
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
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
          className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center"
          style={{ borderColor: 'var(--hairline)' }}
          aria-live="polite"
        >
          <svg
            aria-hidden="true"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--muted)', marginBottom: '16px' }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '15px',
              letterSpacing: '0.08em',
              color: 'var(--muted)',
              margin: '0 0 8px',
            }}
          >
            Geen werelden gevonden
          </p>
          <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
            Maak je eerste wereld aan om te beginnen.
          </p>
          <Button
            onClick={handleCreate}
            loading={createWorld.isPending}
          >
            Creëer een wereld
          </Button>
        </div>
      )}
    </section>
  )
}
