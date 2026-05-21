import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { SessionCard, ForgeSessionCard } from '@/components/session/SessionCard'
import type { Campaign, CampaignStatus } from '@/types/campaign.types'
import type { Session } from '@/types/session.types'

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

const breadcrumbStyle: React.CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

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
      {/* Breadcrumb */}
      <nav aria-label="Navigatie" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate(`/worlds/${campaign.world_id}`)}
            aria-label={`Terug naar ${worldName ?? 'wereld'}`}
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
            {worldName ?? 'Wereld'}
          </button>

          <span aria-hidden="true" style={{ ...breadcrumbStyle, color: 'var(--hairline)' }}>·</span>

          <span style={{ ...breadcrumbStyle, color: 'var(--ink-soft)' }} aria-current="page">
            Kroniek
          </span>
        </div>

        <Link
          to={`/campaigns/${id}/edit`}
          aria-label={`${campaign.name} bewerken`}
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
      </nav>

      {/* Campaign header — full-bleed like WorldDetailHeader */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 320,
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
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            background: scrimGradient,
          }}
        />

        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(120px, 26vw, 260px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.09,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Status badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 28px 0', position: 'relative' }}>
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

        {/* Content at bottom */}
        <div style={{ position: 'relative', padding: '0 clamp(28px, 4vw, 48px) 36px' }}>
          {campaign.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 14, letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 10px',
            }}>
              {campaign.subtitle}
            </p>
          )}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6vw, 80px)',
            fontWeight: 600, lineHeight: 0.92,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: '0 0 16px',
          }}>
            {campaign.name}
          </h1>

          {/* Description + action buttons */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
            {campaign.description && (
              <p style={{
                fontSize: 14, lineHeight: 1.7,
                color: 'var(--ink-soft)', margin: 0,
                maxWidth: 560, flex: '1 1 auto',
              }}>
                {campaign.description}
              </p>
            )}
            <div style={{ flexShrink: 0, display: 'flex', gap: 10, flexWrap: 'wrap', marginLeft: 'auto' }}>
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
      </div>

      <WorldDetailDivider label={`Sessies in deze kroniek${sessions && sessions.length > 0 ? ` (${sessions.length})` : ''}`} />

      {/* Session list */}
      {isLoadingSessions ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-label="Sessies laden...">
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
    </div>
  )
}
