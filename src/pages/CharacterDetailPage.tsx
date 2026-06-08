import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { CharacterStatsTab } from '@/components/character/CharacterStatsTab'
import { CharacterSpellsTab } from '@/components/character/CharacterSpellsTab'
import { CharacterInventoryTab } from '@/components/character/CharacterInventoryTab'
import { CharacterSkillsTab } from '@/components/character/CharacterSkillsTab'
import { CharacterLoreTab } from '@/components/character/CharacterLoreTab'
import { characterStatusLabel, characterStatusColor } from '@/lib/statusMaps'
import {
  useCharacter,
  useUpdateCharacterHp,
  useUpdateCharacterTempHp,
  useCharacterLongRest,
  useUpdateCharacterDeathSaves,
  useUpdateCharacterSpellSlot,
} from '@/hooks/queries/useCharacter'
import { useCharacterItems } from '@/hooks/queries/useCharacterItems'
import { calculateEffectiveStats } from '@/utils/equipmentUtils'
import type { Character } from '@/types/character.types'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'

type Tab = 'stats' | 'spreuken' | 'inventaris' | 'vaardigheden' | 'lore'

function formatXP(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('nl-NL')
}

const headerGradients = [
  'radial-gradient(ellipse 60% 80% at 25% 35%, rgb(var(--azure-rgb) / 0.32) 0%, rgb(var(--violet-rgb) / 0.18) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 28% 38%, rgb(var(--azure-rgb) / 0.28) 0%, rgb(var(--azure-rgb) / 0.18) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 30% 40%, rgb(var(--violet-rgb) / 0.24) 0%, rgb(var(--azure-rgb) / 0.20) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 25% 38%, rgb(var(--azure-rgb) / 0.26) 0%, rgb(var(--teal-rgb) / 0.16) 50%, var(--void) 78%)',
]

function starfieldDots(id: string) {
  const dots = []
  for (let i = 0; i < 10; i++) {
    const seed = (id.charCodeAt(i % id.length) || 37) * (i + 1)
    dots.push({
      x: ((seed * 13) % 90) + 5,
      y: ((seed * 7)  % 80) + 5,
      size: ((seed % 3) + 1) * 1.5,
      opacity: ((seed % 5) + 3) * 0.07,
    })
  }
  return dots
}

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  const { data: character, isLoading } = useCharacter(id)
  const { data: items } = useCharacterItems(id)
  const updateHp       = useUpdateCharacterHp(id!)
  const updateTempHp   = useUpdateCharacterTempHp(id!)
  const longRest       = useCharacterLongRest(id!)
  const updateDeathSaves = useUpdateCharacterDeathSaves(id!)
  const updateSpellSlot  = useUpdateCharacterSpellSlot(id!)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!character) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </Button>
      </div>
    )
  }

  const code = (id!.charCodeAt(0) || 0) + (id!.charCodeAt(id!.length - 1) || 0)
  const headerGradient = headerGradients[code % headerGradients.length]
  const dots = starfieldDots(id!)

  const eyebrowParts = [character.character_race, character.character_class, character.character_subclass].filter(Boolean)
  const xp      = character.xp      ?? 0
  const xpNext  = character.xp_next ?? 0
  const hpCurrent = character.hp_current ?? 0
  const hpMax     = character.hp_max     ?? 0
  const xpPct = xpNext > 0 ? Math.min(100, Math.round((xp / xpNext) * 100)) : 0
  const hpPct = hpMax  > 0 ? Math.min(100, Math.round((hpCurrent / hpMax) * 100)) : 0
  const hpLow = hpCurrent < hpMax * 0.3
  const tempHp = character.temp_hp ?? 0
  const profBonus = character.proficiency_bonus ?? 2

  const equippedItems = (items ?? []).filter((i) => i.equipped_slot !== null)
  const eff = calculateEffectiveStats(character, equippedItems)
  const acBonus = eff.ac - (character.armor_class ?? 0)
  const acContributors = equippedItems
    .filter((i) => (i.properties.ac_bonus ?? 0) !== 0)
    .map((i) => i.name)
  const acSubtitle = acContributors.join(' + ')

  const altSpeeds = [
    { label: '🦅', key: 'fly_speed',    title: 'Vliegen'  },
    { label: '🌊', key: 'swim_speed',   title: 'Zwemmen'  },
    { label: '🧗', key: 'climb_speed',  title: 'Klimmen'  },
    { label: '⛏️', key: 'burrow_speed', title: 'Graven'   },
  ].filter(s => (character[s.key as keyof Character] as number ?? 0) > 0)

  return (
    <div>
      <style>{`
        .char-hero { display: grid; grid-template-columns: 260px 1fr; gap: 28px; align-items: start; margin-bottom: 28px; }
        .char-portrait { border-radius: 20px; border: 1px solid var(--hairline); overflow: hidden; aspect-ratio: 3 / 4; position: relative; }
        .char-combat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .char-ability-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px; }
        @media (max-width: 860px) {
          .char-hero { grid-template-columns: 1fr; }
          .char-portrait { aspect-ratio: 16 / 9; max-height: 220px; border-radius: 16px; }
          .char-combat-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .char-ability-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
      <Breadcrumb
        items={[
          { label: 'Karakters', onClick: () => navigate('/characters') },
          { label: character.name },
        ]}
        actions={
          <Link
            to={`/characters/${id}/edit`}
            aria-label={`${character.name} bewerken`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--muted)', fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', textDecoration: 'none', transition: 'color var(--t-fast)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
          >
            <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Bewerken
          </Link>
        }
      />

      {/* ── Hero header ── */}
      <div className="char-hero">
        {/* Portrait card */}
        <div className="char-portrait" style={{ background: `${headerGradient}, var(--void)` }}>
          {sanitizeImageUrl(character.portrait_url) ? (
            <>
              <img
                src={sanitizeImageUrl(character.portrait_url)!}
                alt={character.name}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: character.portrait_position ?? 'center' }}
              />
              <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 50%)', pointerEvents: 'none' }} />
            </>
          ) : (
            <>
              {dots.map((dot, i) => (
                <div key={i} aria-hidden="true" style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: '50%', background: 'var(--ink)', opacity: dot.opacity, pointerEvents: 'none' }} />
              ))}
              <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '42%', transform: 'translate(-50%, -50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <svg width="110" height="110" viewBox="0 0 100 100" fill="none" aria-hidden="true">
                  <circle cx="50" cy="50" r="42" stroke="rgb(var(--azure-rgb) / 0.18)" strokeWidth="1" fill="none" />
                  <circle cx="50" cy="50" r="30" stroke="rgb(var(--azure-rgb) / 0.10)" strokeWidth="1" fill="rgb(var(--azure-rgb) / 0.05)" />
                  <path d="M 36 26 Q 24 50 36 74 Q 54 60 54 50 Q 54 40 36 26 Z" fill="rgb(var(--azure-rgb) / 0.45)" />
                </svg>
              </div>
              <div aria-hidden="true" style={{ position: 'absolute', bottom: '10%', left: '50%', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: 80, fontWeight: 700, color: 'rgb(var(--azure-rgb) / 0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
                {character.name.charAt(0).toUpperCase()}
              </div>
            </>
          )}
          <div style={{ position: 'absolute', top: 14, right: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: characterStatusColor[character.status], border: `1px solid ${characterStatusColor[character.status]}55`, background: `${characterStatusColor[character.status]}11`, backdropFilter: 'blur(4px)' }}>
              {characterStatusLabel[character.status]}
            </span>
          </div>
        </div>

        {/* Info + stats column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {eyebrowParts.length > 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)', margin: 0 }}>
              {eyebrowParts.join(' · ')}
            </p>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,5vw,52px)', fontWeight: 600, lineHeight: 0.92, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>
            {character.name}
          </h1>

          {/* Level + XP */}
          <div className="pangu-surface" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>Level</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{character.level}</span>
            </div>
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>Experience</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>{formatXP(xp)} / {formatXP(xpNext)} XP</span>
              </div>
              <div role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={xpNext} aria-label={`${xp} van ${xpNext} ervaringspunten`} style={{ height: 6, borderRadius: 3, background: 'var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--violet)', borderRadius: 3, transition: 'width 0.4s var(--ease-out)' }} />
              </div>
            </div>
          </div>

          {/* Combat stats: HP · AC · Initiative · Speed */}
          <div className="char-combat-grid">
            {/* HP */}
            <div className="pangu-surface" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: hpLow ? 'var(--crimson)' : 'var(--muted)', margin: 0 }}>HP</p>
                {tempHp > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--azure)', border: '1px solid rgb(var(--azure-rgb) / 0.35)', borderRadius: 999, padding: '1px 6px' }}>+{tempHp}</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button type="button" aria-label="HP verlagen" onClick={() => updateHp.mutate(Math.max(0, hpCurrent - 1))} disabled={updateHp.isPending || hpCurrent <= 0} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: hpCurrent <= 0 ? 0.4 : 1, flexShrink: 0 }}>−</button>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: hpLow ? 'var(--crimson)' : 'var(--ink)', margin: 0, lineHeight: 1, flex: 1, textAlign: 'center' }}>
                  {hpCurrent}<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 400 }}>/{hpMax}</span>
                </p>
                <button type="button" aria-label="HP verhogen" onClick={() => updateHp.mutate(Math.min(hpMax, hpCurrent + 1))} disabled={updateHp.isPending || hpCurrent >= hpMax} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent >= hpMax ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, opacity: hpCurrent >= hpMax ? 0.4 : 1, flexShrink: 0 }}>+</button>
              </div>
              <div role="progressbar" aria-valuenow={hpCurrent} aria-valuemin={0} aria-valuemax={hpMax} aria-label={`${hpCurrent} van ${hpMax} HP`} style={{ height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${hpPct}%`, background: hpLow ? 'var(--crimson)' : 'var(--teal)', borderRadius: 2, transition: 'width 0.3s var(--ease-out)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ fontSize: 9, color: 'var(--muted)' }}>Temp:</span>
                <button type="button" aria-label="Tijdelijke HP verlagen" onClick={() => updateTempHp.mutate(tempHp - 1)} disabled={updateTempHp.isPending || tempHp <= 0} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: tempHp <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: tempHp <= 0 ? 0.4 : 1 }}>−</button>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--azure)', minWidth: 18, textAlign: 'center' }}>{tempHp}</span>
                <button type="button" aria-label="Tijdelijke HP verhogen" onClick={() => updateTempHp.mutate(tempHp + 1)} disabled={updateTempHp.isPending} style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>+</button>
              </div>
            </div>

            {/* AC */}
            <div className="pangu-surface" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Armor Class</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {eff.ac}{acBonus > 0 && <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--teal)', marginLeft: 4 }}>+{acBonus}</span>}
              </p>
              <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: 'auto 0 0', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {acSubtitle || character.subtitle || ''}
              </p>
            </div>

            {/* Initiative */}
            <div className="pangu-surface" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Initiative</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                {eff.initiative >= 0 ? `+${eff.initiative}` : `${eff.initiative}`}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 'auto 0 0' }}>DEX modifier</p>
            </div>

            {/* Speed */}
            <div className="pangu-surface" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Speed</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {eff.speed}<span style={{ fontSize: 16, fontWeight: 400, color: 'var(--muted)', marginLeft: 3 }}>ft</span>
              </p>
              {altSpeeds.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 'auto' }}>
                  {altSpeeds.map(s => (
                    <span key={s.key} title={s.title} style={{ fontSize: 10, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <span aria-hidden="true">{s.label}</span>
                      {character[s.key as keyof Character] as number}ft
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: 'auto 0 0' }}>Proficiency +{profBonus}</p>
              )}
            </div>
          </div>

          {/* Long rest */}
          <div>
            <button
              type="button"
              onClick={() => longRest.mutate(character)}
              disabled={longRest.isPending || updateHp.isPending || updateDeathSaves.isPending || updateSpellSlot.isPending || updateTempHp.isPending}
              style={{
                fontSize: 11, padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--hairline)', background: 'var(--surface)',
                color: 'var(--muted)', cursor: longRest.isPending ? 'wait' : 'pointer',
                fontFamily: 'var(--font-body)', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                transition: 'all var(--t-fast)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgb(var(--azure-rgb) / 0.5)'
                el.style.color = 'var(--azure)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--hairline)'
                el.style.color = 'var(--muted)'
              }}
            >
              <span aria-hidden="true">☽</span>
              {longRest.isPending ? 'Rusten...' : 'Lange Rust'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" aria-label="Karakter tabs" className="pangu-tab-bar--line" style={{ marginBottom: 20, position: 'sticky', top: 0, zIndex: 20, background: 'var(--void)', paddingTop: 8, paddingBottom: 2, marginTop: -8 }}>
        {([
          { key: 'stats',        label: 'Stats' },
          { key: 'spreuken',     label: 'Spreuken' },
          { key: 'inventaris',   label: `Inventaris${items && items.length > 0 ? ` (${items.length})` : ''}` },
          { key: 'vaardigheden', label: 'Vaardigheden' },
          { key: 'lore',         label: 'Lore' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button key={key} type="button" role="tab" aria-selected={activeTab === key} aria-controls={`tabpanel-${key}`} id={`tab-${key}`} onClick={() => setActiveTab(key)} className="pangu-tab--line">
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'stats'        && <CharacterStatsTab character={character} eff={eff} />}
      {activeTab === 'spreuken'     && <CharacterSpellsTab characterId={id!} character={character} eff={eff} />}
      {activeTab === 'inventaris'   && <CharacterInventoryTab characterId={id!} character={character} />}
      {activeTab === 'vaardigheden' && <CharacterSkillsTab character={character} eff={eff} />}
      {activeTab === 'lore'         && <CharacterLoreTab character={character} />}
    </div>
  )
}
