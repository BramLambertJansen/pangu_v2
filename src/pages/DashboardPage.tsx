import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { CampaignCard } from '@/components/campaign/CampaignCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { World, WorldStatus } from '@/types/world.types'
import type { Campaign } from '@/types/campaign.types'
import type { Session } from '@/types/session.types'

// Deterministic gradient per world based on id — same palette as WorldCard
const worldGradients = [
  'radial-gradient(ellipse 70% 55% at 50% 32%, rgba(155,138,255,0.45) 0%, rgba(80,50,200,0.2) 45%, transparent 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(220,90,80,0.32) 0%, rgba(155,138,255,0.18) 50%, transparent 78%)',
  'radial-gradient(ellipse 65% 52% at 50% 35%, rgba(62,207,178,0.26) 0%, rgba(60,80,200,0.2) 50%, transparent 78%)',
  'radial-gradient(ellipse 65% 50% at 45% 35%, rgba(245,180,50,0.22) 0%, rgba(155,138,255,0.26) 50%, transparent 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) ?? 0) + (id.charCodeAt(id.length - 1) ?? 0)
  return worldGradients[code % worldGradients.length]
}

const worldStatusLabel: Record<WorldStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
}

// Session type extended with joined campaign data
type PlannedSession = Session & {
  campaigns: { name: string; world_id: string } | null
}

// ── Inline sub-components ──────────────────────────────────────────────────

interface StatTileProps {
  label: string
  value: number
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div
      style={{
        flex: 1,
        padding: '20px 24px',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        background: 'var(--void-2)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(28px, 5vw, 40px)',
          fontWeight: 600,
          lineHeight: 1,
          letterSpacing: '0.04em',
          color: 'var(--ink)',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

interface CompactWorldTileProps {
  world: World
}

function CompactWorldTile({ world }: CompactWorldTileProps) {
  const navigate = useNavigate()
  const gradient = pickGradient(world.id)

  function handleClick() {
    navigate(`/worlds/${world.id}`)
  }

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Wereld: ${world.name}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
      }}
      style={{
        position: 'relative',
        borderRadius: 'var(--r-xl)',
        border: '1px solid var(--hairline)',
        overflow: 'hidden',
        cursor: 'pointer',
        padding: '20px 20px 16px',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 12,
        background: 'var(--void-2)',
        transition: 'border-color var(--t-base) var(--ease-out), box-shadow var(--t-base) var(--ease-out), transform var(--t-base) var(--ease-out)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline-strong)'
        el.style.boxShadow = '0 6px 24px rgba(0,0,0,0.35)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.borderColor = 'var(--hairline)'
        el.style.boxShadow = 'none'
        el.style.transform = 'translateY(0)'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      {/* Gradient accent */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }}
      />

      {/* Top row: name + status badge */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(16px, 3vw, 20px)',
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--ink)',
            margin: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            minWidth: 0,
          }}
        >
          {world.name}
        </p>
        <span
          style={{
            flexShrink: 0,
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            background: 'var(--gold)',
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--void)',
          }}
        >
          {worldStatusLabel[world.status]}
        </span>
      </div>

      {/* Bottom row: cta arrow */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <span
          aria-hidden="true"
          style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: 'var(--muted)' }}
        >
          Bekijk →
        </span>
      </div>
    </article>
  )
}

interface PlannedSessionRowProps {
  session: PlannedSession
}

function PlannedSessionRow({ session }: PlannedSessionRowProps) {
  const navigate = useNavigate()

  const formattedDate = session.session_date
    ? new Date(session.session_date).toLocaleDateString('nl-NL', {
        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  function handleClick() {
    navigate(`/sessions/${session.id}/edit`)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Sessie: ${session.name}`}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() }
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '14px 20px',
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--hairline)',
        background: 'var(--void-2)',
        cursor: 'pointer',
        transition: 'border-color var(--t-base) var(--ease-out), background var(--t-base) var(--ease-out)',
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline-strong)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--hairline)'
        e.currentTarget.style.background = 'var(--void-2)'
      }}
      onFocus={(e) => { e.currentTarget.style.outline = '2px solid var(--violet)'; e.currentTarget.style.outlineOffset = '2px' }}
      onBlur={(e) => { e.currentTarget.style.outline = 'none' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {session.session_number != null && (
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'var(--violet)',
                flexShrink: 0,
              }}
            >
              #{session.session_number}
            </span>
          )}
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              color: 'var(--ink)',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {session.name}
          </p>
        </div>
        {session.campaigns?.name && (
          <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0 }}>
            {session.campaigns.name}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {formattedDate && (
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', whiteSpace: 'nowrap' }}>
            {formattedDate}
          </span>
        )}
        <span aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted)' }}>→</span>
      </div>
    </div>
  )
}

interface LinkRowProps {
  href: string
  label: string
}

function LinkRow({ href, label }: LinkRowProps) {
  const navigate = useNavigate()
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
      <button
        type="button"
        onClick={() => navigate(href)}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px 0',
          transition: 'color var(--t-fast)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--ink-soft)' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)' }}
      >
        {label}
      </button>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, profile } = useAuthStore()
  const displayName = profile?.display_name ?? user?.email ?? 'Avonturier'

  const { data: worlds, isLoading: worldsLoading } = useQuery<World[]>({
    queryKey: queryKeys.worlds.all,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data as World[]
    },
    staleTime: 1000 * 60,
  })

  const { data: activeCampaigns, isLoading: campaignsLoading } = useQuery<Campaign[]>({
    queryKey: queryKeys.campaigns.active,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(4)
      if (error) throw error
      return data as Campaign[]
    },
    staleTime: 1000 * 60,
  })

  const { data: plannedSessions, isLoading: sessionsLoading } = useQuery<PlannedSession[]>({
    queryKey: queryKeys.sessions.planned,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*, campaigns(name, world_id)')
        .eq('status', 'planned')
        .order('session_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data as PlannedSession[]
    },
    staleTime: 1000 * 30,
  })

  const isLoading = worldsLoading || campaignsLoading || sessionsLoading

  if (isLoading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}
        aria-live="polite"
        aria-label="Dashboard laden..."
      >
        <Spinner size="lg" />
      </div>
    )
  }

  const worldCount = worlds?.length ?? 0
  const campaignCount = activeCampaigns?.length ?? 0
  const sessionCount = plannedSessions?.length ?? 0

  return (
    <div>
      {/* Page header */}
      <header style={{ marginBottom: 48 }}>
        <p className="pangu-eyebrow">Your adventure awaits</p>
        <h1 className="pangu-display-xl">Welkom, {displayName}</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)', maxWidth: 480, lineHeight: 1.65 }}>
          Hier vind je een overzicht van je werelden, actieve kronieken en geplande sessies.
        </p>
      </header>

      {/* Stats */}
      <div
        style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}
        role="region"
        aria-label="Statistieken"
      >
        <StatTile label="Werelden" value={worldCount} />
        <StatTile label="Actieve kronieken" value={campaignCount} />
        <StatTile label="Geplande sessies" value={sessionCount} />
      </div>

      {/* Mijn werelden */}
      <WorldDetailDivider label="Mijn werelden" />

      {worldCount === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          Nog geen werelden. Begin met het smeden van je eerste wereld.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {worlds!.map((world) => (
              <CompactWorldTile key={world.id} world={world} />
            ))}
          </div>
          <LinkRow href="/worlds" label="Alle werelden →" />
        </>
      )}

      {/* Actieve kronieken */}
      <WorldDetailDivider label="Actieve kronieken" />

      {campaignCount === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          Geen actieve kronieken. Stel een kroniek in op 'Actief' om hem hier te zien.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {activeCampaigns!.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      {/* Geplande sessies */}
      <WorldDetailDivider label="Geplande sessies" />

      {sessionCount === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          Geen sessies gepland. Voeg een sessie toe aan een kroniek om hem hier te zien.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {plannedSessions!.map((session) => (
            <PlannedSessionRow key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
