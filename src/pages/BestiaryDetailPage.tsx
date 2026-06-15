import { useParams, useNavigate, Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumbs'
import { OrnateDivider } from '@/components/ui/OrnateDivider'
import { useBestiaryFull } from '@/hooks/queries/useBestiary'
import { bestiaryStatusLabel, bestiaryStatusColor } from '@/lib/statusMaps'
import { pickGradient, bestiaryGradients } from '@/utils/pickGradient'
import type { BestiaryAction } from '@/types/bestiary.types'
import { ABILITY_SCORES, formatModifier } from '@/utils/dnd5e'

export default function BestiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: bestiary, isLoading } = useBestiaryFull(id)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wezen laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!bestiary) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wezen niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </Button>
      </div>
    )
  }

  const world = bestiary.worlds
  const gradient = pickGradient(bestiary.id, bestiaryGradients)
  const initial = bestiary.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <Breadcrumb
        variant="arcane"
        items={[
          ...(world ? [{ label: world.name, onClick: () => navigate(`/worlds/${world.id}`) }] : []),
          ...(world ? [{ label: 'Bestiarium', onClick: () => navigate(`/worlds/${world.id}/bestiary`) }] : []),
          { label: bestiary.name },
        ]}
        actions={
          <Link
            to={`/bestiary/${id}/edit`}
            aria-label={`${bestiary.name} bewerken`}
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

        {/* Creature type + status badges */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '20px 28px 0', flexWrap: 'wrap' }}>
          {bestiary.creature_type && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--teal)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--teal)',
              background: 'rgb(var(--teal-rgb) / 0.08)',
            }}>
              {bestiary.creature_type}
            </span>
          )}
          {bestiary.threat_level && (
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 12px',
              border: '1px solid var(--gold)',
              borderRadius: 'var(--r-full)',
              fontFamily: 'var(--font-body)',
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--gold)',
              background: 'rgb(var(--gold-rgb) / 0.08)',
            }}>
              {bestiary.threat_level}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: bestiaryStatusColor[bestiary.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {bestiaryStatusLabel[bestiary.status]}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ position: 'relative', padding: '0 clamp(24px, 4vw, 48px) 32px', display: 'flex', alignItems: 'flex-end', gap: 24 }}>
          {bestiary.image_url && (
            <img
              src={bestiary.image_url}
              alt={bestiary.name}
              style={{
                width: 120, height: 120,
                objectFit: 'cover',
                borderRadius: 12,
                border: '2px solid var(--hairline)',
                flexShrink: 0,
                boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              }}
            />
          )}
          <div>
            {bestiary.subtitle && (
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontStyle: 'italic',
                fontSize: 'clamp(14px, 1.6vw, 17px)', letterSpacing: '0.03em',
                color: 'var(--gold)', margin: '0 0 12px',
              }}>
                {bestiary.subtitle}
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
              {bestiary.name}
            </h1>
            {bestiary.habitat && (
              <p style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                Leefgebied: {bestiary.habitat}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stat block */}
      <OrnateDivider label="Statistieken" />
      <div className="surface" style={{ padding: 24 }}>
        {/* Combat stats */}
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { label: 'HP', value: bestiary.hp },
            { label: 'Wapenrusting (AC)', value: bestiary.ac },
            { label: 'Snelheid', value: `${bestiary.speed} ft` },
          ].map(({ label, value }) => (
            <div key={label} style={{ minWidth: 80 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>
                {label}
              </p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-body)' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Ability scores */}
        <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>
            Eigenschappen
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {ABILITY_SCORES.map(({ key, abbr, label }) => {
              const score = bestiary[key] as number
              return (
                <div
                  key={abbr}
                  style={{
                    textAlign: 'center',
                    padding: '10px 4px',
                    borderRadius: 8,
                    background: 'var(--surface-2)',
                    border: '1px solid var(--hairline)',
                  }}
                >
                  <p
                    style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 2px' }}
                    title={label}
                  >
                    {abbr}
                  </p>
                  <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', margin: '0 0 1px', fontFamily: 'var(--font-body)' }}>
                    {score}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 0 }}>
                    {formatModifier(score)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Extended stat block */}
      {(bestiary.alignment || bestiary.hit_dice || bestiary.proficiency_bonus != null ||
        bestiary.senses || bestiary.languages || bestiary.saving_throws || bestiary.skills ||
        bestiary.damage_immunities || bestiary.damage_resistances || bestiary.damage_vulnerabilities ||
        bestiary.condition_immunities || bestiary.speed_details) && (
        <>
          <OrnateDivider label="Aanvullende Statistieken" />
          <div className="surface" style={{ padding: 24 }}>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px 24px', margin: 0 }}>
              {([
                ['Uitlijning', bestiary.alignment],
                ['Trefdobbelsteen', bestiary.hit_dice],
                ['Vaardigheidsbonus', bestiary.proficiency_bonus != null ? `+${bestiary.proficiency_bonus}` : null],
                ['Snelheid (details)', bestiary.speed_details],
                ['Zintuigen', bestiary.senses],
                ['Talen', bestiary.languages],
                ['Reddingsgooien', bestiary.saving_throws],
                ['Vaardigheden', bestiary.skills],
                ['Schade immuniteiten', bestiary.damage_immunities],
                ['Schade resistenties', bestiary.damage_resistances],
                ['Schade kwetsbaarheden', bestiary.damage_vulnerabilities],
                ['Conditie immuniteiten', bestiary.condition_immunities],
              ] as [string, string | number | null][]).filter(([, v]) => v != null).map(([label, value]) => (
                <div key={label}>
                  <dt style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
                    {label}
                  </dt>
                  <dd style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </>
      )}

      {/* Combat sections */}
      {(['special_abilities', 'actions', 'bonus_actions', 'reactions'] as const).map(section => {
        const entries = bestiary[section] as BestiaryAction[] | null
        if (!entries?.length) return null
        const labels: Record<string, string> = {
          special_abilities: 'Speciale Eigenschappen',
          actions: 'Acties',
          bonus_actions: 'Bonusacties',
          reactions: 'Reacties',
        }
        return (
          <div key={section}>
            <OrnateDivider label={labels[section]} />
            <div className="surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {entries.map((entry, i) => (
                <div key={i}>
                  <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                    <em>{entry.name}.</em>
                  </p>
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                    {entry.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {(bestiary.legendary_actions?.length || bestiary.legendary_desc) && (
        <div>
          <OrnateDivider label="Legendarische Acties" />
          <div className="surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {bestiary.legendary_desc && (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', fontStyle: 'italic' }}>
                {bestiary.legendary_desc}
              </p>
            )}
            {(bestiary.legendary_actions as BestiaryAction[] | null)?.map((entry, i) => (
              <div key={i}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  <em>{entry.name}.</em>
                </p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                  {entry.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(bestiary.lair_actions as BestiaryAction[] | null)?.length && (
        <div>
          <OrnateDivider label="Hol Acties" />
          <div className="surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(bestiary.lair_actions as BestiaryAction[]).map((entry, i) => (
              <div key={i}>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  <em>{entry.name}.</em>
                </p>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', whiteSpace: 'pre-wrap' }}>
                  {entry.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <OrnateDivider label="Beschrijving" />
      {bestiary.description ? (
        <div className="surface" style={{ padding: 28 }}>
          <p style={{
            fontSize: 15, lineHeight: 1.75,
            color: 'var(--ink-soft)', margin: 0,
            whiteSpace: 'pre-wrap',
          }}>
            {bestiary.description}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen beschrijving toegevoegd.
        </p>
      )}

      {/* DM notes */}
      <OrnateDivider label="DM-notities" />
      {bestiary.notes ? (
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
            {bestiary.notes}
          </p>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
          Nog geen DM-notities.
        </p>
      )}
    </div>
  )
}
