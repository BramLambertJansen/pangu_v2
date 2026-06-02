import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { WorldDetailDivider } from '@/components/world/WorldDetailDivider'
import type { BestiaryWithWorld, BestiaryStatus, BestiaryAction } from '@/types/bestiary.types'

const statusLabel: Record<BestiaryStatus, string> = {
  draft:    'Concept',
  active:   'Actief',
  archived: 'Gearchiveerd',
}

const statusColor: Record<BestiaryStatus, string> = {
  draft:    'var(--gold)',
  active:   'var(--teal)',
  archived: 'var(--muted)',
}

const cardGradients = [
  'radial-gradient(ellipse 60% 80% at 25% 35%, rgba(62,207,178,0.34) 0%, rgba(30,120,90,0.20) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 28% 38%, rgba(62,207,178,0.28) 0%, rgba(155,138,255,0.18) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(30,160,110,0.30) 0%, rgba(62,207,178,0.22) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 25% 38%, rgba(245,180,50,0.24) 0%, rgba(62,207,178,0.22) 50%, var(--void) 78%)',
]

function pickGradient(id: string): string {
  const code = (id.charCodeAt(0) || 0) + (id.charCodeAt(id.length - 1) || 0)
  return cardGradients[code % cardGradients.length]
}

const abilityScores: { key: keyof BestiaryWithWorld; abbr: string; label: string }[] = [
  { key: 'stat_str', abbr: 'STR', label: 'Sterkte' },
  { key: 'stat_dex', abbr: 'DEX', label: 'Behendigheid' },
  { key: 'stat_con', abbr: 'CON', label: 'Constitutie' },
  { key: 'stat_int', abbr: 'INT', label: 'Intelligentie' },
  { key: 'stat_wis', abbr: 'WIS', label: 'Wijsheid' },
  { key: 'stat_cha', abbr: 'CHA', label: 'Charisma' },
]

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function BestiaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: bestiary, isLoading } = useQuery<BestiaryWithWorld>({
    queryKey: queryKeys.worlds.bestiaryDetailFull(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*, worlds(id, name)')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as BestiaryWithWorld
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

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
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
        </button>
      </div>
    )
  }

  const world = bestiary.worlds
  const gradient = pickGradient(bestiary.id)
  const initial = bestiary.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div>
      <Breadcrumb
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
              background: 'rgba(62,207,178,0.08)',
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
              background: 'rgba(245,180,50,0.08)',
            }}>
              {bestiary.threat_level}
            </span>
          )}
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '4px 12px',
            background: statusColor[bestiary.status],
            borderRadius: 'var(--r-full)',
            fontFamily: 'var(--font-body)',
            fontSize: 10, fontWeight: 700,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: 'var(--void)',
          }}>
            {statusLabel[bestiary.status]}
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
      <WorldDetailDivider label="Statistieken" />
      <div className="pangu-surface" style={{ padding: 24 }}>
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
            {abilityScores.map(({ key, abbr, label }) => {
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
                    {abilityModifier(score)}
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
          <WorldDetailDivider label="Aanvullende Statistieken" />
          <div className="pangu-surface" style={{ padding: 24 }}>
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
            <WorldDetailDivider label={labels[section]} />
            <div className="pangu-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <WorldDetailDivider label="Legendarische Acties" />
          <div className="pangu-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
          <WorldDetailDivider label="Hol Acties" />
          <div className="pangu-surface" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <WorldDetailDivider label="Beschrijving" />
      {bestiary.description ? (
        <div className="pangu-surface" style={{ padding: 28 }}>
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
      <WorldDetailDivider label="DM-notities" />
      {bestiary.notes ? (
        <div
          className="pangu-surface"
          style={{
            padding: 28,
            borderColor: 'rgba(245,180,50,0.22)',
            background: 'linear-gradient(180deg, rgba(245,180,50,0.04), transparent)',
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
