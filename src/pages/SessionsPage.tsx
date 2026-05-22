import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SessionCard, ForgeSessionCard } from '@/components/session/SessionCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Campaign } from '@/types/campaign.types'
import type { Session } from '@/types/session.types'
import { useAuthStore } from '@/stores/auth.store'

export default function SessionsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingSession, setCreatingSession] = useState(false)

  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: queryKeys.campaigns.detail(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId!)
        .single()
      if (error) throw error
      return data as Campaign
    },
    enabled: !!campaignId,
    staleTime: 1000 * 60,
  })

  const { data: sessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: queryKeys.campaigns.sessions(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('session_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })

  const createSession = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const nextNumber = sessions && sessions.length > 0
        ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
        : 1
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuwe sessie',
          session_number: nextNumber,
          status: 'planned',
        })
        .select()
        .single()
      if (error) throw error
      return data as Session
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sessions(campaignId!) })
      navigate(`/sessions/${newSession.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('Sessie aanmaken mislukt')
      setCreatingSession(false)
    },
  })

  function handleCreateSession() {
    setCreatingSession(true)
    createSession.mutate()
  }

  if (campaignLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Kroniek laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Kroniek niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs items={[
          { label: 'Wereld', to: `/worlds/${campaign.world_id}` },
          { label: campaign.name, to: `/campaigns/${campaignId}` },
          { label: 'Sessies' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Sessies</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de spelsessies van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${sessions?.length ?? 0} sessie${sessions?.length !== 1 ? 's' : ''}`} />

      {/* Session grid */}
      <div style={{ marginTop: 24 }}>
        {sessionsLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Sessies laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!sessions || sessions.length === 0) && (
              <EmptyState
                title="Nog geen sessies"
                description="Begin met je eerste avontuur. Elke grote queeste start met één stap."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions?.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
              <ForgeSessionCard onClick={handleCreateSession} loading={creatingSession} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
