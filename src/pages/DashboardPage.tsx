import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { WorldCard } from '@/components/world/WorldCard'
import { CampaignCard } from '@/components/campaign/CampaignCard'
import { SessionCard } from '@/components/session/SessionCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { World } from '@/types/world.types'
import type { Campaign } from '@/types/campaign.types'
import type { Session } from '@/types/session.types'

function LinkRow({ href, label }: { href: string; label: string }) {
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

  const { data: plannedSessions, isLoading: sessionsLoading } = useQuery<Session[]>({
    queryKey: queryKeys.sessions.planned,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('status', 'planned')
        .order('session_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      return data as Session[]
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
        <p className="pangu-eyebrow">Het avontuur wacht</p>
        <h1 className="pangu-display-xl">Welkom, {displayName}</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)', maxWidth: 480, lineHeight: 1.65 }}>
          Hier vind je een overzicht van je werelden, actieve kronieken en geplande sessies.
        </p>
      </header>

      {/* Mijn werelden */}
      <WorldDetailDivider label="Mijn werelden" />

      {worldCount === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          Nog geen werelden. Begin met het smeden van je eerste wereld.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {worlds!.map((world) => (
              <WorldCard key={world.id} world={world} />
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plannedSessions!.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
