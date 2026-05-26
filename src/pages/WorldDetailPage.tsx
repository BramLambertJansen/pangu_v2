import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { WorldDetailHeader } from '@/components/world/WorldDetailHeader'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { CampaignCard, ForgeCampaignCard } from '@/components/campaign/CampaignCard'
import type { World } from '@/types/world.types'
import type { Campaign } from '@/types/campaign.types'

export default function WorldDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const { data: world, isLoading } = useQuery<World>({
    queryKey: queryKeys.worlds.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as World
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const { data: campaigns, isLoading: isLoadingCampaigns } = useQuery<Campaign[]>({
    queryKey: queryKeys.campaigns.byWorld(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('world_id', id!)
        .eq('committed', true)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Campaign[]
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const createCampaign = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('campaigns')
        .insert({ world_id: id!, user_id: user.id })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: (campaignId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.byWorld(id!) })
      navigate(`/campaigns/${campaignId}/edit`, { state: { isNew: true, worldId: id } })
    },
    onError: () => {
      toast.error('Kroniek aanmaken mislukt')
    },
  })

  function handleCreateCampaign() {
    toast.promise(createCampaign.mutateAsync(), {
      loading: 'Kroniek aanmaken...',
      success: 'Kroniek aangemaakt',
      error: 'Aanmaken mislukt',
    })
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wereld laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </button>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Werelden', onClick: () => navigate('/worlds') },
          { label: world.name },
        ]}
        actions={
          <Link
            to={`/worlds/${id}/edit`}
            aria-label={`${world.name} bewerken`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--muted)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Bewerken
          </Link>
        }
      />

      <WorldDetailHeader
        world={world}
        onCreateCampaign={handleCreateCampaign}
        isCreatingCampaign={createCampaign.isPending}
      />

      <WorldDetailDivider label="Kronieken in deze wereld" />

      {/* Campaign list */}
      {isLoadingCampaigns ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Kronieken laden..." aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
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
          aria-label="Kronieken in deze wereld"
        >
          {campaigns?.map((campaign) => (
            <li key={campaign.id}>
              <CampaignCard campaign={campaign} />
            </li>
          ))}
          <li>
            <ForgeCampaignCard onClick={handleCreateCampaign} loading={createCampaign.isPending} />
          </li>
        </ul>
      )}

      <WorldDetailDivider label="DM-notities" />

      {/* DM notes */}
      {world.notes ? (
        <div
          className="pangu-surface"
          style={{
            padding: 28,
            borderColor: 'rgba(245,180,50,0.22)',
            background: 'linear-gradient(180deg, rgba(245,180,50,0.04), transparent)',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--gold)', margin: '0 0 12px',
          }}>
            ✦ Alleen zichtbaar voor de DM
          </p>
          <p style={{
            fontSize: 14, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {world.notes}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen DM-notities.
        </p>
      )}

      <WorldDetailDivider label="Bestiarium" />

      {/* Bestiary entry point */}
      <Link
        to={`/worlds/${id}/bestiary`}
        style={{ textDecoration: 'none' }}
        aria-label="Bestiarium van deze wereld openen"
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderRadius: 'var(--r-xl)',
            border: '1px solid var(--hairline)',
            background: 'var(--surface)',
            cursor: 'pointer',
            transition: 'border-color var(--t-fast), background var(--t-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(62,207,178,0.35)'
            e.currentTarget.style.background = 'rgba(62,207,178,0.04)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--hairline)'
            e.currentTarget.style.background = 'var(--surface)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 40, height: 40,
              borderRadius: 'var(--r-full)',
              background: 'rgba(62,207,178,0.10)',
              border: '1px solid rgba(62,207,178,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
                <path d="M8 12s1.5 2 4 2 4-2 4-2" />
                <path d="M9 9h.01M15 9h.01" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                Bestiarium
              </p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Catalogiseer de wezens en monsters van {world.name}
              </p>
            </div>
          </div>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </Link>
    </div>
  )
}
