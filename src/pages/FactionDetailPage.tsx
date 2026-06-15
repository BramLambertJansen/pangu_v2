import { useParams, useNavigate, Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumbs'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { RelatedEntities } from '@/components/link/RelatedEntities'
import { pickGradient, factionGradients } from '@/utils/pickGradient'
import {
  factionStatusLabel, factionStatusColor,
  factionTypeLabel,
  factionReputationLabel, factionReputationColor,
} from '@/lib/statusMaps'
import { useFactionFull, useFactionMembers } from '@/hooks/queries/useFaction'

export default function FactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: faction, isLoading } = useFactionFull(id)
  const { data: members } = useFactionMembers(id)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Factie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!faction) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Factie niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  const campaign = faction.campaigns
  const world = campaign?.worlds ?? null
  const gradient = pickGradient(faction.id, factionGradients)
  const initial = faction.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <Breadcrumb
        variant="arcane"
        items={[
          ...(world ? [{ label: world.name, onClick: () => navigate(`/worlds/${world.id}`) }] : []),
          ...(campaign ? [
            { label: campaign.name, onClick: () => navigate(`/campaigns/${campaign.id}`) },
            { label: 'Facties', onClick: () => navigate(`/campaigns/${campaign.id}/factions`) },
          ] : []),
          { label: 'Factie' },
        ]}
        actions={
          <Link
            to={`/factions/${id}/edit`}
            aria-label={`${faction.name} bewerken`}
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
        <div
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, background: `${gradient}, var(--void)` }}
        />

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

        {/* Type + reputation + status badges */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
          {faction.type && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--crimson)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--crimson)',
              background: 'rgb(var(--crimson-rgb) / 0.08)',
            }}>
              {factionTypeLabel[faction.type]}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            border: `1px solid ${factionReputationColor[faction.reputation]}`,
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: factionReputationColor[faction.reputation],
            background: 'rgb(var(--void-rgb) / 0.15)',
          }}>
            {factionReputationLabel[faction.reputation]}
          </span>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: factionStatusColor[faction.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {factionStatusLabel[faction.status]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', padding: '0 clamp(24px, 4vw, 48px) 32px' }}>
          {faction.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.6vw, 17px)', letterSpacing: '0.03em',
              color: 'var(--gold)', margin: '0 0 12px',
            }}>
              {faction.subtitle}
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
            {faction.name}
          </h1>
        </div>
      </div>

      {/* Motto */}
      {faction.motto && (
        <>
          <OrnateDivider label="Motto" />
          <div className="surface" style={{ padding: 28 }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 18, lineHeight: 1.6,
              color: 'var(--gold)', margin: 0,
              textAlign: 'center',
            }}>
              &ldquo;{faction.motto}&rdquo;
            </p>
          </div>
        </>
      )}

      {/* Goals */}
      {faction.goals && (
        <>
          <OrnateDivider label="Doelen" />
          <div className="surface" style={{ padding: 28 }}>
            <p style={{
              fontSize: 15, lineHeight: 1.75,
              color: 'var(--ink-soft)', margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {faction.goals}
            </p>
          </div>
        </>
      )}

      {/* Description */}
      <OrnateDivider label="Beschrijving" />
      {faction.description ? (
        <div className="surface" style={{ padding: 28 }}>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {faction.description}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen beschrijving toegevoegd.
        </p>
      )}

      {/* Members */}
      <OrnateDivider label={`Leden (${members?.length ?? 0})`} />
      {members && members.length > 0 ? (
        <div className="surface" style={{ padding: 20 }}>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 4, listStyle: 'none', padding: 0, margin: 0 }}>
            {members.map((npc) => (
              <li key={npc.id}>
                <Link
                  to={`/npcs/${npc.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--hairline)',
                    background: 'var(--surface)',
                    textDecoration: 'none',
                    transition: 'background var(--t-fast), border-color var(--t-fast)',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgb(var(--crimson-rgb) / 0.3)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--hairline)' }}
                >
                  <div
                    aria-hidden="true"
                    style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'var(--surface-2)',
                      border: '1px solid var(--hairline)',
                      fontFamily: 'var(--font-display)',
                      fontSize: 17, fontWeight: 700,
                      color: 'var(--crimson)',
                    }}
                  >
                    {npc.name.trim()[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0,
                      fontFamily: 'var(--font-display)',
                      fontSize: 14, fontWeight: 600,
                      letterSpacing: '0.03em',
                      color: 'var(--ink)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {npc.name}
                    </p>
                    {npc.npc_role && (
                      <p style={{
                        margin: '2px 0 0',
                        fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'var(--crimson)',
                        fontFamily: 'var(--font-body)',
                      }}>
                        {npc.npc_role}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen leden gekoppeld. Koppel NPCs aan deze factie via hun bewerkscherm.
        </p>
      )}

      {/* DM notes */}
      <OrnateDivider label="DM-notities" />
      {faction.notes ? (
        <div
          className="surface"
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
            {faction.notes}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen DM-notities.
        </p>
      )}

      {faction.campaign_id && (
        <RelatedEntities type="faction" id={faction.id} campaignId={faction.campaign_id} />
      )}
    </div>
  )
}
