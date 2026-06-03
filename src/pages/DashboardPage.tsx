import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { WorldCard } from '@/components/world/WorldCard'
import { CampaignCard } from '@/components/campaign/CampaignCard'
import { SessionCard } from '@/components/session/SessionCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { useWorlds } from '@/hooks/queries/useWorld'
import { useActiveCampaigns } from '@/hooks/queries/useCampaign'
import { usePlannedSessions } from '@/hooks/queries/useSession'

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
  const user = useAuthStore(s => s.user)
  const profile = useAuthStore(s => s.profile)
  const displayName = profile?.display_name ?? user?.email ?? 'Avonturier'

  const { data: worlds, isLoading: worldsLoading } = useWorlds()
  const { data: activeCampaigns, isLoading: campaignsLoading } = useActiveCampaigns()
  const { data: plannedSessions, isLoading: sessionsLoading } = usePlannedSessions()

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

      {worldsLoading ? (
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-5)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Werelden laden..." aria-live="polite">
          <EntityCardSkeleton count={2} variant="hero" />
        </ul>
      ) : (worlds?.length ?? 0) === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
          Nog geen werelden. Begin met het smeden van je eerste wereld.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {worlds!.slice(0, 4).map((world) => (
              <WorldCard key={world.id} world={world} />
            ))}
          </div>
          <LinkRow href="/worlds" label="Alle werelden →" />
        </>
      )}

      {/* Actieve kronieken */}
      <WorldDetailDivider label="Actieve kronieken" />

      {campaignsLoading ? (
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Kronieken laden..." aria-live="polite">
          <EntityCardSkeleton count={2} />
        </ul>
      ) : (activeCampaigns?.length ?? 0) === 0 ? (
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

      {sessionsLoading ? (
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Sessies laden..." aria-live="polite">
          <EntityCardSkeleton count={3} />
        </ul>
      ) : (plannedSessions?.length ?? 0) === 0 ? (
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
