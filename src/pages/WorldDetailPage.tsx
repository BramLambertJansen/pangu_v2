import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
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
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => navigate('/worlds')}
          aria-label="Terug naar werelden"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)', padding: 0,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Alle werelden
        </button>

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
      </div>

      <WorldDetailHeader
        world={world}
        onCreateCampaign={handleCreateCampaign}
        isCreatingCampaign={createCampaign.isPending}
      />

      <WorldDetailDivider label="Kronieken in deze wereld" />

      {/* Campaign list */}
      {isLoadingCampaigns ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Kronieken laden...">
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
    </div>
  )
}
