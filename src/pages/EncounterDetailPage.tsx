import { useParams, useNavigate, Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumbs'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { RelatedEntities } from '@/components/link/RelatedEntities'
import { CombatTracker, type Combatant } from '@/components/encounter/CombatTracker'
import { useEncounterFull } from '@/hooks/queries/useEncounter'
import { useEncounterMonsters } from '@/hooks/queries/useEncounterMonsters'
import { encounterStatusLabel, encounterStatusColor } from '@/lib/statusMaps'
import { pickGradient, encounterGradients } from '@/utils/pickGradient'

export default function EncounterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: encounter, isLoading } = useEncounterFull(id)
  const { data: monsters, isLoading: monstersLoading } = useEncounterMonsters(id)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Gevecht laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!encounter) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Gevecht niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  const campaign = encounter.campaigns
  const world = campaign?.worlds ?? null
  const gradient = pickGradient(encounter.id, encounterGradients)
  const initial = encounter.name.trim()[0]?.toUpperCase() ?? '?'

  // Initiative preview ordered by each creature's DEX modifier (no roll at rest).
  const initiativeOrder: Combatant[] = (monsters ?? []).map((m) => {
    const b = m.bestiary
    const dexMod = b ? Math.floor((b.stat_dex - 10) / 2) : 0
    return {
      id: m.id,
      name: `${b?.name ?? 'Onbekend'}${m.count > 1 ? ` ×${m.count}` : ''}`,
      initiative: dexMod,
      hp: b?.hp ?? 0,
      maxHp: b?.hp ?? 0,
    }
  })

  return (
    <div>
      <Breadcrumb
        items={[
          ...(world ? [{ label: world.name, onClick: () => navigate(`/worlds/${world.id}`) }] : []),
          ...(campaign ? [
            { label: campaign.name, onClick: () => navigate(`/campaigns/${campaign.id}`) },
            { label: 'Gevechten', onClick: () => navigate(`/campaigns/${campaign.id}/encounters`) },
          ] : []),
          { label: 'Gevecht' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              to={`/encounters/${id}/run`}
              aria-label={`${encounter.name} starten`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                color: 'var(--violet)', fontSize: 12, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                fontFamily: 'var(--font-body)',
                textDecoration: 'none',
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--ink)')}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => (e.currentTarget.style.color = 'var(--violet)')}
            >
              <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
              </svg>
              Starten
            </Link>
            <Link
              to={`/encounters/${id}/edit`}
              aria-label={`${encounter.name} bewerken`}
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
          </div>
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

        {/* Badges */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
          {encounter.difficulty && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid rgb(var(--crimson-rgb) / 0.4)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--crimson)',
              background: 'rgb(var(--crimson-rgb) / 0.08)',
            }}>
              {encounter.difficulty}
            </span>
          )}
          {encounter.environment && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--ink-soft)',
              background: 'rgb(var(--ink-rgb) / 0.04)',
            }}>
              {encounter.environment}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: encounterStatusColor[encounter.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {encounterStatusLabel[encounter.status]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', padding: '0 clamp(24px, 4vw, 48px) 32px' }}>
          {encounter.subtitle && (
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontStyle: 'italic',
              fontSize: 'clamp(14px, 1.6vw, 17px)', letterSpacing: '0.03em',
              color: 'var(--crimson)', margin: '0 0 12px',
            }}>
              {encounter.subtitle}
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
            {encounter.name}
          </h1>
        </div>
      </div>

      {/* Monsters */}
      <OrnateDivider label="Monsters" />
      {monstersLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <Spinner size="sm" />
        </div>
      ) : monsters && monsters.length > 0 ? (
        <div className="surface" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }} role="table" aria-label="Monsters in dit gevecht">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--hairline)' }}>
                {(['Naam', 'Type', 'Dreiging', 'HP', 'AC', 'Aantal'] as const).map((h) => (
                  <th key={h} scope="col" style={{
                    padding: '12px 16px',
                    textAlign: h === 'Aantal' ? 'center' : 'left',
                    fontFamily: 'var(--font-body)',
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monsters.map((m, i) => {
                const b = m.bestiary
                return (
                  <tr
                    key={m.id}
                    style={{
                      borderBottom: i < monsters.length - 1 ? '1px solid var(--hairline)' : 'none',
                      transition: 'background var(--t-fast)',
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = 'rgb(var(--ink-rgb) / 0.03)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = '')}
                  >
                    <td style={{ padding: '12px 16px', color: 'var(--ink)', fontWeight: 600 }}>
                      {b?.name ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>
                      {b?.creature_type ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--crimson)', fontWeight: 600 }}>
                      {b?.threat_level ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>
                      {b?.hp ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>
                      {b?.ac ?? '—'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: 28, height: 28,
                        borderRadius: 'var(--r-full)',
                        background: 'rgb(var(--crimson-rgb) / 0.12)',
                        border: '1px solid rgb(var(--crimson-rgb) / 0.24)',
                        color: 'var(--crimson)',
                        fontWeight: 700, fontSize: 13,
                        fontFamily: 'var(--font-body)',
                      }}>
                        {m.count}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen monsters toegevoegd.
        </p>
      )}

      {/* Initiative order preview */}
      {initiativeOrder.length > 0 && (
        <>
          <OrnateDivider label="Initiatiefvolgorde (verwacht)" />
          <CombatTracker encounterId={encounter.id} combatants={initiativeOrder} activeIndex={-1} />
        </>
      )}

      {/* Description */}
      <OrnateDivider label="Beschrijving" />
      {encounter.description ? (
        <div className="surface" style={{ padding: 28 }}>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {encounter.description}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen beschrijving toegevoegd.
        </p>
      )}

      {/* DM notes */}
      <OrnateDivider label="DM-notities" />
      {encounter.notes ? (
        <div
          className="surface"
          style={{
            padding: 28,
            borderColor: 'rgb(var(--crimson-rgb) / 0.22)',
            background: 'linear-gradient(180deg, rgb(var(--crimson-rgb) / 0.04), transparent)',
          }}
        >
          <p style={{
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--crimson)', margin: '0 0 12px',
          }}>
            ✦ Alleen zichtbaar voor de DM
          </p>
          <p style={{
            fontSize: 14, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {encounter.notes}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen DM-notities.
        </p>
      )}

      <RelatedEntities type="encounter" id={encounter.id} campaignId={encounter.campaign_id} />
    </div>
  )
}
