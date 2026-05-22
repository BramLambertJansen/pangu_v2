import { useParams, useNavigate, Link } from 'react-router-dom'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { SessionCard, ForgeSessionCard } from '@/components/session/SessionCard'
import { LocationCard, ForgeLocationCard } from '@/components/location/LocationCard'
import { LoreCard, ForgeLoreCard } from '@/components/lore/LoreCard'
import { NpcCard, ForgeNpcCard } from '@/components/npc/NpcCard'
import type { Campaign, CampaignStatus } from '@/types/campaign.types'
import type { Session } from '@/types/session.types'
import type { Location } from '@/types/location.types'
import type { Lore } from '@/types/lore.types'
import type { Npc } from '@/types/npc.types'

type CampaignWithWorld = Campaign & { worlds: { name: string } | null }

const statusLabel: Record<CampaignStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
  completed: 'Voltooid',
}

const cardGradients = [
  'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(155,138,255,0.55) 0%, rgba(80,50,200,0.28) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 28% 42%, rgba(220,90,80,0.4) 0%, rgba(155,138,255,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 52% at 30% 42%, rgba(62,207,178,0.32) 0%, rgba(60,80,200,0.28) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 65% 50% at 25% 40%, rgba(245,180,50,0.28) 0%, rgba(155,138,255,0.32) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return cardGradients[code % cardGradients.length]
}

const scrimGradient =
  'linear-gradient(to top, var(--void) 0%, rgba(10,10,22,0.97) 20%, rgba(10,10,22,0.72) 40%, rgba(10,10,22,0.18) 62%, transparent 82%)'

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const { data: campaign, isLoading } = useQuery<CampaignWithWorld>({
    queryKey: queryKeys.campaigns.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*, worlds(name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as CampaignWithWorld
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const { data: sessions, isLoading: isLoadingSessions } = useQuery<Session[]>({
    queryKey: queryKeys.campaigns.sessions(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('campaign_id', id!)
        .order('session_number', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Session[]
    },
    enabled: !!id,
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
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe sessie', session_number: nextNumber, status: 'planned' })
        .select()
        .single()
      if (error) throw error
      return data as Session
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.sessions(id!) })
      navigate(`/sessions/${newSession.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => {
      toast.error('Sessie aanmaken mislukt')
    },
  })

  const { data: locations, isLoading: isLoadingLocations } = useQuery<Location[]>({
    queryKey: queryKeys.campaigns.locations(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('campaign_id', id!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Location[]
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })

  const createLocation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('locations')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe locatie', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Location
    },
    onSuccess: (newLocation) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(id!) })
      navigate(`/locations/${newLocation.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => {
      toast.error('Locatie aanmaken mislukt')
    },
  })

  const { data: loreItems, isLoading: isLoadingLore } = useQuery<Lore[]>({
    queryKey: queryKeys.campaigns.lore(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*')
        .eq('campaign_id', id!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Lore[]
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })

  const createLore = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('lore')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe lore', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Lore
    },
    onSuccess: (newLore) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(id!) })
      navigate(`/lore/${newLore.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => {
      toast.error('Lore aanmaken mislukt')
    },
  })

  const { data: npcs, isLoading: isLoadingNpcs } = useQuery<Npc[]>({
    queryKey: queryKeys.campaigns.npcs(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('npcs')
        .select('*')
        .eq('campaign_id', id!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Npc[]
    },
    enabled: !!id,
    staleTime: 1000 * 30,
  })

  const createNpc = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Niet ingelogd')
      const { data, error } = await supabase
        .from('npcs')
        .insert({ campaign_id: id!, user_id: user.id, name: 'Nieuwe NPC', status: 'draft' })
        .select()
        .single()
      if (error) throw error
      return data as Npc
    },
    onSuccess: (newNpc) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.npcs(id!) })
      navigate(`/npcs/${newNpc.id}/edit`, { state: { isNew: true, campaignId: id } })
    },
    onError: () => {
      toast.error('NPC aanmaken mislukt')
    },
  })

  if (isLoading) {
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

  const initial = campaign.name.trim()[0]?.toUpperCase() ?? '?'
  const gradient = campaign.header_image ? undefined : pickGradient(campaign.id)
  const worldName = campaign.worlds?.name ?? null

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Wereld', onClick: () => navigate(`/worlds/${campaign.world_id}`) },
        { label: campaign.name },
      ]} />

      {/* Campaign header — full-bleed, same responsive layout as WorldDetailHeader */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
        }}
      >
        {/* Background */}
        {campaign.header_image ? (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${campaign.header_image})`,
              backgroundSize: 'cover',
              backgroundPosition: campaign.header_image_position ?? 'center',
            }}
          />
        ) : (
          <div
            aria-hidden="true"
            style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
          />
        )}

        {/* Scrim */}
        <div aria-hidden="true" className="wdh-scrim" style={{ background: scrimGradient }} />

        {/* ── MOBILE LAYOUT ── */}
        <div className="wdh-mobile">
          {/* Watermark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '8%', left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(120px, 38vw, 180px)',
              fontWeight: 600,
              color: 'var(--ink)', opacity: 0.09,
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {initial}
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              background: 'var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--void)',
            }}>
              {statusLabel[campaign.status]}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 24px 28px' }}>
            {campaign.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 13, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 10px',
              }}>
                {campaign.subtitle}
              </p>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(40px, 12vw, 56px)',
              fontWeight: 600, lineHeight: 0.92,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: '0 0 14px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {campaign.name}
            </h1>
            {campaign.description && (
              <p style={{
                fontSize: 13, lineHeight: 1.7,
                color: 'var(--ink-soft)', margin: '0 0 18px',
              }}>
                {campaign.description}
              </p>
            )}
            <div className="wdh-btns">
              <button
                type="button"
                className="pangu-btn pangu-btn-primary"
                aria-label="Sessie starten"
                onClick={() => navigate(`/campaigns/${id}/sessions`)}
              >
                ▶ Sessie starten
              </button>
              <button
                type="button"
                className="pangu-btn pangu-btn-gold"
                aria-label="Lore Forge — AI lore genereren"
              >
                ✦ Lore Forge
              </button>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="wdh-desktop">
          {/* Watermark */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '8%', left: '50%',
              transform: 'translateX(-50%)',
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(180px, 26vw, 320px)',
              fontWeight: 600,
              color: 'var(--ink)', opacity: 0.09,
              lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {initial}
          </div>

          {/* Status badge */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px 0' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              background: 'var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--void)',
            }}>
              {statusLabel[campaign.status]}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: '0 clamp(28px, 4vw, 48px) 36px' }}>
            {campaign.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 15, letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 12px',
              }}>
                {campaign.subtitle}
              </p>
            )}
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(56px, 6.5vw, 96px)',
              fontWeight: 600, lineHeight: 0.92,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'var(--ink)', margin: '0 0 18px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {campaign.name}
            </h1>

            {/* Description left, buttons right */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {campaign.description && (
                  <p style={{
                    fontSize: 14, lineHeight: 1.7,
                    color: 'var(--ink-soft)', margin: 0,
                  }}>
                    {campaign.description}
                  </p>
                )}
              </div>
              <div style={{ flexShrink: 0, display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="pangu-btn pangu-btn-primary"
                  aria-label="Sessie starten"
                  onClick={() => navigate(`/campaigns/${id}/sessions`)}
                >
                  ▶ Sessie starten
                </button>
                {/* Lore Forge: hidden until AI integration is implemented */}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WorldDetailDivider label={`Sessies in deze kroniek${sessions && sessions.length > 0 ? ` (${sessions.length})` : ''}`} />

      {/* Session list */}
      {isLoadingSessions ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Sessies laden..." aria-busy="true">
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
          aria-label="Sessies in deze kroniek"
        >
          {sessions?.map((session) => (
            <li key={session.id}>
              <SessionCard session={session} />
            </li>
          ))}
          <li>
            <ForgeSessionCard onClick={() => createSession.mutate()} loading={createSession.isPending} />
          </li>
        </ul>
      )}

      <WorldDetailDivider label={`Locaties in deze kroniek${locations && locations.length > 0 ? ` (${locations.length})` : ''}`} />

      {/* Location list */}
      {isLoadingLocations ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Locaties laden..." aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <>
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
            aria-label="Locaties in deze kroniek"
          >
            {locations?.map((loc) => (
              <li key={loc.id}>
                <LocationCard location={loc} />
              </li>
            ))}
            <li>
              <ForgeLocationCard onClick={() => createLocation.mutate()} loading={createLocation.isPending} />
            </li>
          </ul>
          {locations && locations.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={() => navigate(`/campaigns/${id}/locations`)}
              >
                Alle locaties bekijken →
              </button>
            </div>
          )}
        </>
      )}

      <WorldDetailDivider label={`Lore in deze kroniek${loreItems && loreItems.length > 0 ? ` (${loreItems.length})` : ''}`} />

      {/* Lore list */}
      {isLoadingLore ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Lore laden..." aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <>
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
            aria-label="Lore in deze kroniek"
          >
            {loreItems?.map((lore) => (
              <li key={lore.id}>
                <LoreCard lore={lore} />
              </li>
            ))}
            <li>
              <ForgeLoreCard onClick={() => createLore.mutate()} loading={createLore.isPending} />
            </li>
          </ul>
          {loreItems && loreItems.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={() => navigate(`/campaigns/${id}/lore`)}
              >
                Alle lore bekijken →
              </button>
            </div>
          )}
        </>
      )}

      <WorldDetailDivider label={`NPCs in deze kroniek${npcs && npcs.length > 0 ? ` (${npcs.length})` : ''}`} />

      {/* NPC list */}
      {isLoadingNpcs ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="NPCs laden..." aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <>
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
            aria-label="NPCs in deze kroniek"
          >
            {npcs?.map((npc) => (
              <li key={npc.id}>
                <NpcCard npc={npc} />
              </li>
            ))}
            <li>
              <ForgeNpcCard onClick={() => createNpc.mutate()} loading={createNpc.isPending} />
            </li>
          </ul>
          {npcs && npcs.length > 0 && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                onClick={() => navigate(`/campaigns/${id}/npcs`)}
              >
                Alle NPCs bekijken →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
