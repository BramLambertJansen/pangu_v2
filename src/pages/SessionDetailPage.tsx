import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumbs'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { RelatedEntities } from '@/components/link/RelatedEntities'
import { PartyMemberRow } from '@/components/character/CharacterCard'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useSessionFull } from '@/hooks/queries/useSession'
import { sessionStatusLabel, sessionStatusColor } from '@/lib/statusMaps'
import { PlayerNotepad } from '@/components/session/PlayerNotepad'
import { DmPlayerNotesPanel } from '@/components/session/DmPlayerNotesPanel'
import { pickGradient, sessionGradients } from '@/utils/pickGradient'
import type { SessionStatus } from '@/types/session.types'
import { formatDate } from '@/utils/format'

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const { data: session, isLoading } = useSessionFull(id)

  const campaignId = session?.campaign_id ?? undefined
  const { data: partyMembers } = useCampaignCharacters(campaignId)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Sessie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Sessie niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  const campaign = session.campaigns
  const world = campaign?.worlds ?? null
  const gradient = pickGradient(session.id, sessionGradients)
  const isDM = !!user && user.id === session.user_id
  const initial = session.name.trim()[0]?.toUpperCase() ?? '?'
  const formattedDate = formatDate(session.session_date)

  return (
    <div>
      <Breadcrumb
        items={[
          ...(world ? [{ label: world.name, onClick: () => navigate(`/worlds/${world.id}`) }] : []),
          ...(campaign ? [
            { label: campaign.name, onClick: () => navigate(`/campaigns/${campaign.id}`) },
            { label: 'Sessies', onClick: () => navigate(`/campaigns/${campaign.id}/sessions`) },
          ] : []),
          { label: 'Sessie' },
        ]}
        actions={
          <Link
            to={`/sessions/${id}/edit`}
            aria-label={`${session.name} bewerken`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: 'var(--muted)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              fontFamily: 'var(--font-body)',
              textDecoration: 'none',
              transition: 'color var(--t-fast)',
            }}
            onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Bewerken
          </Link>
        }
      />

      {/* Header card */}
      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--r-xl)',
          border: '1px solid var(--hairline)',
          overflow: 'hidden',
          minHeight: 260,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Gradient background */}
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
        />

        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '8%', left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(140px, 22vw, 280px)',
            fontWeight: 600,
            color: 'var(--ink)', opacity: 0.08,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {initial}
        </div>

        {/* Session number + date + status badges */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
          {session.session_number != null && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid rgb(var(--violet-rgb) / 0.4)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--violet)',
              background: 'rgb(var(--violet-rgb) / 0.08)',
            }}>
              Sessie {session.session_number}
            </span>
          )}
          {formattedDate && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid rgb(var(--gold-rgb) / 0.35)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'rgb(var(--gold-rgb) / 0.06)',
            }}>
              {formattedDate}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: sessionStatusColor[session.status as SessionStatus],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {sessionStatusLabel[session.status as SessionStatus]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', padding: '0 clamp(24px, 4vw, 48px) 32px' }}>
          {session.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.6vw, 17px)', letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 12px',
            }}>
              {session.subtitle}
            </p>
          )}
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 6.5vw, 80px)',
            fontWeight: 600, lineHeight: 0.95,
            letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--ink)', margin: 0,
            overflowWrap: 'break-word',
          }}>
            {session.name}
          </h1>
        </div>
      </div>

      {/* Description */}
      <OrnateDivider label="Beschrijving" />
      {session.description ? (
        <div className="pangu-surface" style={{ padding: 28 }}>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {session.description}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen beschrijving toegevoegd.
        </p>
      )}

      {/* DM notes — only visible to the DM */}
      {isDM && (
        <>
          <OrnateDivider label="DM-notities" />
          {session.notes ? (
            <div
              className="pangu-surface"
              style={{
                padding: 28,
                borderColor: 'rgb(var(--gold-rgb) / 0.22)',
                background: 'linear-gradient(180deg, rgb(var(--gold-rgb) / 0.04), transparent)',
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
                {session.notes}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
              Nog geen DM-notities.
            </p>
          )}
        </>
      )}

      {/* The Party — only shown when characters are linked to this campaign */}
      {partyMembers && partyMembers.length > 0 && (
        <>
          <OrnateDivider label="The Party" />
          <ul
            style={{ display: 'flex', flexDirection: 'column', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}
            role="list"
            aria-label="Karakters in deze sessie"
          >
            {partyMembers.slice(0, 4).map((character) => (
              <li key={character.id}>
                <PartyMemberRow character={character} />
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Player notes — players write, DM reads for consolidation */}
      <OrnateDivider label="Spelernotities" />
      {isDM
        ? <DmPlayerNotesPanel sessionId={id!} />
        : <PlayerNotepad sessionId={id!} campaignId={session.campaign_id} />
      }

      <RelatedEntities type="session" id={session.id} campaignId={session.campaign_id} />
    </div>
  )
}
