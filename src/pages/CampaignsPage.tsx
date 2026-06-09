import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth.store'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { CampaignCard, ForgeCampaignCard } from '@/components/campaign/CampaignCard'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import type { World } from '@/types/world.types'
import { useWorlds } from '@/hooks/queries/useWorld'
import { useAllCampaignsWithWorlds, useCreateCampaign, type CampaignWithWorldIds } from '@/hooks/queries/useCampaign'
import { useDraftGC } from '@/hooks/useDraftGC'

interface WorldGroup {
  worldId: string
  worldName: string
  campaigns: CampaignWithWorldIds[]
}

function buildWorldGroups(worlds: World[], campaigns: CampaignWithWorldIds[]): WorldGroup[] {
  const campaignsByWorld = new Map<string, CampaignWithWorldIds[]>()
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
  const user = useAuthStore(s => s.user)

  const { data: worlds, isLoading: worldsLoading } = useWorlds()
  const { data: campaigns, isLoading: campaignsLoading } = useAllCampaignsWithWorlds()
  const createCampaign = useCreateCampaign()

  useDraftGC('campaigns', 'user_id', user?.id)

  const isLoading = worldsLoading || campaignsLoading

  function handleCreate(worldId: string) {
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
          <Button
            variant="secondary"
            onClick={() => navigate('/worlds')}
            style={{ marginBottom: 8, flexShrink: 0 }}
          >
            Werelden bekijken →
          </Button>
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
            <Button
              variant="primary"
              onClick={() => navigate('/worlds')}
            >
              Naar werelden
            </Button>
          }
        />
      ) : (
        <>
          {worldGroups.map(({ worldId, worldName, campaigns: worldCampaigns }) => (
            <section key={worldId} aria-label={worldName}>
              <OrnateDivider label={worldName} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -28, marginBottom: 16 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/worlds/${worldId}`)}
                >
                  Naar wereld →
                </Button>
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
                    loading={createCampaign.isPending}
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
