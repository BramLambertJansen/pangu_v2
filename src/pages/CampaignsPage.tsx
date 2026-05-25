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
import type { World } from '@/types/world.types'

interface CampaignWithWorld extends Campaign {
  worlds: { id: string; name: string }
}

interface WorldGroup {
  worldId: string
  worldName: string
  campaigns: CampaignWithWorld[]
}

function buildWorldGroups(worlds: World[], campaigns: CampaignWithWorld[]): WorldGroup[] {
  const campaignsByWorld = new Map<string, CampaignWithWorld[]>()
  for (const c of campaigns) {
    const arr = campaignsByWorld.get(c.world_id) ?? []
    arr.push(c)
    campaignsByWorld.set(c.world_id, arr)
  }
  return worlds.map(w => ({
    worldId: w.id,
    worldName: w.name ?? 'Naamloze wereld',
    campaigns: campaignsByWorld.get(w.id) ?? [],
  }))
}

export default function CampaignsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)
  const [creatingForWorldId, setCreatingForWorldId] = useState<string | null>(null)

  const { data: worlds, isLoading: worldsLoading } = useQuery<World[]>({
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

  const { data: campaigns, isLoading: campaignsLoading } = useQuery<CampaignWithWorld[]>({
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

  const isLoading = worldsLoading || campaignsLoading

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

  const worldGroups = worlds && campaigns ? buildWorldGroups(worlds, campaigns) : []
  const hasNoWorlds = !isLoading && (!worlds || worlds.length === 0)

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
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)', listStyle: 'none', padding: 0, margin: 0 }}
          aria-label="Kronieken laden..."
          aria-live="polite"
        >
          <EntityCardSkeleton count={4} />
        </ul>
      ) : hasNoWorlds ? (
        <EmptyState
          title="Nog geen werelden"
          description="Een kroniek leeft binnen een wereld. Maak eerst een wereld aan om avonturen te beginnen."
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
          {worldGroups.map(({ worldId, worldName, campaigns: worldCampaigns }) => (
            <section key={worldId} aria-label={worldName}>
              <WorldDetailDivider label={worldName} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -28, marginBottom: 16 }}>
                <button
                  type="button"
                  className="pangu-btn pangu-btn-ghost"
                  style={{ fontSize: 12, padding: '4px 12px' }}
                  onClick={() => navigate(`/worlds/${worldId}`)}
                >
                  Naar wereld →
                </button>
              </div>
              <ul
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
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
