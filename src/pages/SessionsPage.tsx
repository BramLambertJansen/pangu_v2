import { useParams, useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EntityCardSkeleton } from '@/components/ui/EntityCardSkeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { SessionCard, ForgeSessionCard } from '@/components/session/SessionCard'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import { useCampaign } from '@/hooks/queries/useCampaign'
import { useCampaignSessions, useCreateCampaignSession } from '@/hooks/queries/useCampaignSessions'
import { useDraftGC } from '@/hooks/useDraftGC'

export default function SessionsPage() {
  const { id: campaignId } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: sessions, isLoading: sessionsLoading } = useCampaignSessions(campaignId)
  const createSession = useCreateCampaignSession(campaignId!)

  useDraftGC('sessions', 'campaign_id', campaignId)

  function handleCreateSession() {
    const nextNumber = sessions && sessions.length > 0
      ? Math.max(...sessions.map((s) => s.session_number ?? 0)) + 1
      : 1
    createSession.mutate({ sessionNumber: nextNumber })
  }

  if (campaignLoading) {
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
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24 }}>
        <Breadcrumbs items={[
          { label: 'Wereld', to: `/worlds/${campaign.world_id}` },
          { label: campaign.name, to: `/campaigns/${campaignId}` },
          { label: 'Sessies' },
        ]} />
      </div>

      {/* Page header */}
      <header style={{ marginBottom: 32 }}>
        <p className="pangu-eyebrow">Kroniek — {campaign.name}</p>
        <h1 className="pangu-display-xl">Sessies</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Beheer de spelsessies van deze kroniek.
        </p>
      </header>

      <WorldDetailDivider label={`${sessions?.length ?? 0} sessie${sessions?.length !== 1 ? 's' : ''}`} />

      {/* Session grid */}
      <div style={{ marginTop: 24 }}>
        {sessionsLoading ? (
          <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--sp-4)', listStyle: 'none', padding: 0, margin: 0 }} aria-label="Sessies laden..." aria-live="polite">
            <EntityCardSkeleton count={3} />
          </ul>
        ) : (
          <>
            {(!sessions || sessions.length === 0) && (
              <EmptyState
                title="Nog geen sessies"
                description="Begin met je eerste avontuur. Elke grote queeste start met één stap."
              />
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions?.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
              <ForgeSessionCard onClick={handleCreateSession} loading={createSession.isPending} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
