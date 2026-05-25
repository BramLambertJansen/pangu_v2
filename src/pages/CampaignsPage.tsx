import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { CampaignCard, ForgeCampaignCard } from '@/components/campaign/CampaignCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { Campaign } from '@/types/campaign.types'

interface CampaignWithWorld extends Campaign {
  worlds: { id: string; name: string }
}

interface WorldGroup {
  worldId: string
  worldName: string
  campaigns: CampaignWithWorld[]
}

function groupByWorld(campaigns: CampaignWithWorld[]): WorldGroup[] {
  const map = new Map<string, WorldGroup>()
  for (const campaign of campaigns) {
    const worldId = campaign.world_id
    const worldName = campaign.worlds?.name ?? 'Onbekende wereld'
    if (!map.has(worldId)) {
      map.set(worldId, { worldId, worldName, campaigns: [] })
    }
    map.get(worldId)!.campaigns.push(campaign)
  }
  return Array.from(map.values())
}

export default function CampaignsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingForWorldId, setCreatingForWorldId] = useState<string | null>(null)

  const { data: campaigns, isLoading } = useQuery<CampaignWithWorld[]>({
    queryKey: queryKeys.campaigns.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(id, name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as CampaignWithWorld[]
    },
    staleTime: 1000 * 60,
  })

  const createCampaign = useMutation({
    mutationFn: async (worldId: string) => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ world_id: worldId, user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      return { id: data.id as string, worldId }
    },
    onSuccess: ({ id, worldId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(worldId) })
      navigate(`/campaigns/${id}/edit`, { state: { isNew: true, worldId } })
    },
    onError: () => {
      toast.error('Kroniek aanmaken mislukt')
      setCreatingForWorldId(null)
    },
  })

  function handleCreate(worldId: string) {
    setCreatingForWorldId(worldId)
    toast.promise(createCampaign.mutateAsync(worldId), {
      loading: 'Kroniek aanmaken...',
      success: 'Kroniek aangemaakt',
      error: 'Aanmaken mislukt',
    })
  }

  const worldGroups = campaigns ? groupByWorld(campaigns) : []
  const totalCount = campaigns?.length ?? 0

  return (
    <div>
      {/* Page header */}
      <header style={{ marginBottom: 48 }}>
        <p className="pangu-eyebrow">De loop der avonturen</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
          <h1 className="pangu-display-xl">Kronieken</h1>
          <button
            type="button"
            className="pangu-btn pangu-btn-secondary"
            onClick={() => navigate('/worlds')}
            style={{ marginBottom: 8, flexShrink: 0 }}
          >
            Werelden bekijken →
          </button>
        </div>
        <p style={{ marginTop: 16, fontSize: 15, color: 'var(--ink-soft)', maxWidth: 560, lineHeight: 1.65 }}>
          Een kroniek bundelt alle avonturen binnen een wereld — sessies, locaties, NPCs, lore en meer.
        </p>
      </header>

      {/* Content */}
      {isLoading ? (
        <ul
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-5)', listStyle: 'none', padding: 0, margin: 0 }}
          aria-label="Kronieken laden..."
          aria-live="polite"
        >
          <EntityCardSkeleton count={4} />
        </ul>
      ) : worldGroups.length === 0 ? (
        <EmptyState
          title="Nog geen kronieken"
          description="Begin met een wereld en voeg daar een kroniek aan toe om je avonturen bij te houden."
          action={
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              onClick={() => navigate('/worlds')}
            >
              Naar werelden
            </button>
          }
        />
      ) : (
        <>
          {totalCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8 }} aria-hidden="true">
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
                  {totalCount} {totalCount === 1 ? 'kroniek' : 'kronieken'}
                </span>
                <span style={{ color: 'var(--gold)', fontSize: 9 }}>✦</span>
              </div>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--hairline-strong))' }} />
            </div>
          )}

          {worldGroups.map(({ worldId, worldName, campaigns: worldCampaigns }) => (
            <section key={worldId} aria-labelledby={`world-${worldId}`}>
              <WorldDetailDivider label={worldName} />
              <ul
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 'var(--sp-4)',
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 var(--sp-6)',
                }}
                role="list"
                aria-label={`Kronieken in ${worldName}`}
              >
                {worldCampaigns.map((campaign) => (
                  <li key={campaign.id}>
                    <CampaignCard campaign={campaign} />
                  </li>
                ))}
                <li>
                  <ForgeCampaignCard
                    onClick={() => handleCreate(worldId)}
                    loading={creatingForWorldId === worldId && createCampaign.isPending}
                  />
                </li>
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  )
}
