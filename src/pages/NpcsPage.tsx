import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { NpcCard, ForgeNpcCard } from '@/components/npc/NpcCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Campaign } from '@/types/campaign.types'
import type { Npc } from '@/types/npc.types'
import { useAuthStore } from '@/stores/auth.store'

const breadcrumbStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

export default function NpcsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const [creatingNpc, setCreatingNpc] = useState(false)

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

  const { data: npcs, isLoading: npcsLoading } = useQuery<Npc[]>({
    queryKey: queryKeys.campaigns.npcs(campaignId!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Npc[]
    },
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  })

  const createNpc = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('npcs')
        .insert({
          campaign_id: campaignId!,
          user_id: user.id,
          name: 'Nieuwe NPC',
          status: 'draft',
        })
        .select()
        .single()
      if (error) throw error
      return data as Npc
    },
    onSuccess: (newNpc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(campaignId!) })
      navigate(`/npcs/${newNpc.id}/edit`, {
        state: { isNew: true, campaignId },
      })
    },
    onError: () => {
      toast.error('NPC aanmaken mislukt')
      setCreatingNpc(false)
    },
  })

  function handleCreateNpc() {
    setCreatingNpc(true)
    createNpc.mutate()
  }

  const isLoading = campaignLoading || npcsLoading

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="NPCs laden...">
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
      <nav aria-label="Navigatie" style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate(`/worlds/${campaign.world_id}`)}
            aria-label="Terug naar wereld"
            style={{
              ...breadcrumbStyle,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 0,
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
            </svg>
            Wereld
          </button>

          <span aria-hidden="true" style={{ ...breadcrumbStyle, color: 'var(--hairline)' }}>·</span>

          <button
            type="button"
            onClick={() => navigate(`/campaigns/${campaignId}`)}
            aria-label={`Terug naar ${campaign.name}`}
            style={{
              ...breadcrumbStyle,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--muted)', padding: 0,
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            {campaign.name}
          </button>

          <span aria-hidden="true" style={{ ...breadcrumbStyle, color: 'var(--hairline)' }}>·</span>

          <span style={{ ...breadcrumbStyle, color: 'var(--ink-soft)' }} aria-current="page">
            NPCs
          </span>
        </div>
      </nav>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">NPCs</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de personages van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${npcs?.length ?? 0} personage${npcs?.length !== 1 ? 's' : ''}`} />

      {/* NPC grid */}
      <div style={{ marginTop: 24 }}>
        {(!npcs || npcs.length === 0) && (
          <p style={{
            fontSize: 14, color: 'var(--muted)',
            fontStyle: 'italic', marginBottom: 24,
          }}>
            Nog geen personages. Breng de eerste NPC tot leven.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {npcs?.map((npc) => (
            <NpcCard key={npc.id} npc={npc} />
          ))}
          <ForgeNpcCard onClick={handleCreateNpc} loading={creatingNpc} />
        </div>
      </div>
    </div>
  )
}
