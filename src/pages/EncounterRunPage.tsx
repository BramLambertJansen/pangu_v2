import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCampaignCharacters } from '@/hooks/queries/useCampaignCharacters'
import { useEncounterMonsters } from '@/hooks/queries/useEncounterMonsters'
import { useEncounterFull } from '@/hooks/queries/useEncounter'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Chip } from '@/components/ui/Chip'
import type { Character } from '@/types/character.types'
import type { Bestiary } from '@/types/bestiary.types'
import { abilityModifier, formatModifier, formatSign } from '@/utils/dnd5e'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Combatant {
  id: string
  type: 'character' | 'monster' | 'manual'
  name: string
  initiative: number
  hpCurrent: number
  hpMax: number
  modifier: number
  character?: Character
  bestiary?: Bestiary
}

interface SetupEntry {
  id: string
  type: 'character' | 'monster'
  name: string
  initiativeRoll: string
  modifier: number
  hpCurrent: number
  hpMax: number
  character?: Character
  bestiary?: Bestiary
}

// ─── Helpers ──────────────────────────────────────────────────────────────────


function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1
}

function hpBarColor(current: number, max: number): string {
  if (max === 0) return 'var(--muted)'
  const pct = current / max
  if (pct > 0.5) return 'var(--teal)'
  if (pct > 0.25) return 'var(--gold)'
  return 'var(--crimson)'
}


const MONSTER_ICONS: Record<string, string> = {
  humanoid: '✚',
  beast: '⚔',
  undead: '✚',
  elemental: '◈',
  dragon: '✦',
  construct: '⚙',
  fey: '☽',
  fiend: '✚',
  celestial: '✦',
  plant: '❧',
  aberration: '◈',
  monstrosity: '✚',
  ooze: '◈',
  swarm: '⚔',
}

function getMonsterIcon(creatureType?: string | null): string {
  if (!creatureType) return '✚'
  return MONSTER_ICONS[creatureType.toLowerCase()] ?? '✚'
}

// ─── Small reusable display pieces ───────────────────────────────────────────

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      textAlign: 'center',
      background: 'var(--surface-2)',
      borderRadius: 10,
      padding: '10px 8px',
      border: '1px solid var(--hairline)',
    }}>
      <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>
        {label}
      </p>
      <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: 0, fontFamily: 'var(--font-display)' }}>
        {value}
      </p>
    </div>
  )
}

function AbilityGrid({ scores }: { scores: { label: string; score: number }[]; }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
      {scores.map(s => (
        <div key={s.label} style={{
          textAlign: 'center',
          background: 'var(--surface-2)',
          borderRadius: 8,
          padding: '8px 4px',
          border: '1px solid var(--hairline)',
        }}>
          <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>
            {s.label}
          </p>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold)', margin: '0 0 2px', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
            {formatModifier(s.score)}
          </p>
          <p style={{ fontSize: 10, color: 'var(--ink-soft)', margin: 0 }}>{s.score}</p>
        </div>
      ))}
    </div>
  )
}

function HpRow({ current, max, onAdjust }: { current: number; max: number; onAdjust: (d: number) => void }) {
  const pct = max > 0 ? current / max : 0
  const color = hpBarColor(current, max)
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          HP
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => onAdjust(-1)}
            aria-label="HP verminderen"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid var(--hairline-strong)', background: 'var(--surface-2)',
              color: 'var(--crimson)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background var(--t-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--crimson-rgb) / 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            ▼
          </button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--ink)', minWidth: 72, textAlign: 'center' }}>
            {current} <span style={{ fontSize: 14, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>/ {max}</span>
          </span>
          <button
            onClick={() => onAdjust(+1)}
            aria-label="HP verhogen"
            style={{
              width: 28, height: 28, borderRadius: '50%',
              border: '1px solid var(--hairline-strong)', background: 'var(--surface-2)',
              color: 'var(--teal)', fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background var(--t-fast)',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--teal-rgb) / 0.15)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          >
            ▲
          </button>
        </div>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'rgb(var(--ink-rgb) / 0.08)' }}>
        <div style={{ width: `${pct * 100}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.3s ease, background 0.3s ease' }} />
      </div>
    </div>
  )
}

// ─── Stat popup content ────────────────────────────────────────────────────────

function CharacterStatPopup({ character, hpCurrent, onAdjustHp }: { character: Character; hpCurrent: number; onAdjustHp: (d: number) => void }) {
  const scores = [
    { label: 'STR', score: character.stat_str },
    { label: 'DEX', score: character.stat_dex },
    { label: 'CON', score: character.stat_con },
    { label: 'INT', score: character.stat_int },
    { label: 'WIS', score: character.stat_wis },
    { label: 'CHA', score: character.stat_cha },
  ]

  const classLine = [
    character.character_race,
    character.character_class && `${character.character_class}${character.character_subclass ? ` (${character.character_subclass})` : ''}`,
    `Level ${character.level}`,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
      {classLine && (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px' }}>{classLine}</p>
      )}

      <HpRow current={hpCurrent} max={character.hp_max} onAdjust={onAdjustHp} />

      {character.temp_hp > 0 && (
        <p style={{ fontSize: 12, color: 'var(--azure)', margin: '-12px 0 16px' }}>
          +{character.temp_hp} tijdelijk HP
        </p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatBox label="AC" value={character.armor_class} />
        <StatBox label="Initiatief" value={formatSign(character.initiative ?? 0)} />
        <StatBox label="Snelheid" value={`${character.speed}ft`} />
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Eigenschappen
      </p>
      <div style={{ marginBottom: 20 }}>
        <AbilityGrid scores={scores} />
      </div>

      {character.saving_throw_proficiencies.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
            Reddingsgooien
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {character.saving_throw_proficiencies.map(s => (
              <Chip key={s} tone="violet">{s.toUpperCase()}</Chip>
            ))}
          </div>
        </div>
      )}

      {character.active_conditions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
            Condities
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {character.active_conditions.map(c => (
              <Chip key={c} tone="crimson">{c}</Chip>
            ))}
          </div>
        </div>
      )}

      {Object.keys(character.class_resources).length > 0 && (
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
            Klassresources
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(character.class_resources).map(([name, res]) => (
              <Chip key={name} tone="teal">{name}: {res.current}/{res.max}</Chip>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MonsterStatPopup({ bestiary, hpCurrent, hpMax, onAdjustHp }: { bestiary: Bestiary; hpCurrent: number; hpMax: number; onAdjustHp: (d: number) => void }) {
  const scores = [
    { label: 'STR', score: bestiary.stat_str },
    { label: 'DEX', score: bestiary.stat_dex },
    { label: 'CON', score: bestiary.stat_con },
    { label: 'INT', score: bestiary.stat_int },
    { label: 'WIS', score: bestiary.stat_wis },
    { label: 'CHA', score: bestiary.stat_cha },
  ]

  const metaLine = [
    bestiary.creature_type,
    bestiary.threat_level ? `CR ${bestiary.threat_level}` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
      {metaLine && (
        <p style={{ color: 'var(--muted)', fontSize: 13, margin: '0 0 16px' }}>{metaLine}</p>
      )}

      <HpRow current={hpCurrent} max={hpMax} onAdjust={onAdjustHp} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <StatBox label="AC" value={bestiary.ac} />
        <StatBox label="Snelheid" value={`${bestiary.speed}ft`} />
        <StatBox label="Init Mod" value={formatModifier(bestiary.stat_dex)} />
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
        Eigenschappen
      </p>
      <div style={{ marginBottom: 20 }}>
        <AbilityGrid scores={scores} />
      </div>

      {bestiary.description && (
        <div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
            Beschrijving
          </p>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>
            {bestiary.description}
          </p>
        </div>
      )}
    </div>
  )
}

function ManualStatPopup({ combatant, onAdjustHp }: { combatant: Combatant; onAdjustHp: (d: number) => void }) {
  return (
    <div>
      <HpRow current={combatant.hpCurrent} max={combatant.hpMax} onAdjust={onAdjustHp} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <StatBox label="Initiatief" value={combatant.initiative} />
        <StatBox label="Max HP" value={combatant.hpMax} />
      </div>
    </div>
  )
}

// ─── Setup section ─────────────────────────────────────────────────────────────

function SetupSection({
  title,
  entries,
  onUpdate,
  onRoll,
}: {
  title: string
  entries: SetupEntry[]
  onUpdate: (id: string, field: 'initiativeRoll' | 'hpCurrent' | 'hpMax', value: string) => void
  onRoll: (id: string) => void
}) {
  return (
    <div style={{ marginBottom: 32 }}>
      <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>
        {title}
      </p>
      <div className="pangu-surface" style={{ padding: 0, overflow: 'hidden' }}>
        {entries.map((entry, i) => (
          <div
            key={entry.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 60px 1fr 80px',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderBottom: i < entries.length - 1 ? '1px solid var(--hairline)' : 'none',
            }}
          >
            {/* Name */}
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', margin: '0 0 2px' }}>{entry.name}</p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 0 }}>Mod: {formatSign(entry.modifier)}</p>
            </div>

            {/* Initiative roll */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="number"
                value={entry.initiativeRoll}
                onChange={e => onUpdate(entry.id, 'initiativeRoll', e.target.value)}
                placeholder="—"
                aria-label={`Initiatief voor ${entry.name}`}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--violet)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
              />
            </div>

            {/* HP current / max */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <input
                type="number"
                value={entry.hpCurrent}
                onChange={e => onUpdate(entry.id, 'hpCurrent', e.target.value)}
                aria-label={`HP huidig voor ${entry.name}`}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--teal)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
              />
              <span style={{ color: 'var(--muted)', fontSize: 13 }}>/</span>
              <input
                type="number"
                value={entry.hpMax}
                onChange={e => onUpdate(entry.id, 'hpMax', e.target.value)}
                aria-label={`HP max voor ${entry.name}`}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--hairline-strong)',
                  borderRadius: 8,
                  padding: '6px 8px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--ink-soft)',
                  textAlign: 'center',
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
              />
            </div>

            {/* Roll button */}
            <button
              type="button"
              onClick={() => onRoll(entry.id)}
              aria-label={`Initiatief gooien voor ${entry.name}`}
              style={{
                padding: '7px 10px',
                borderRadius: 8,
                border: '1px solid var(--hairline-strong)',
                background: 'var(--surface-2)',
                color: 'var(--ink-soft)',
                fontSize: 12,
                fontWeight: 700,
                fontFamily: 'var(--font-body)',
                letterSpacing: '0.06em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background var(--t-fast), color var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.12)'; e.currentTarget.style.color = 'var(--violet)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--ink-soft)' }}
            >
              🎲 Gooi
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function EncounterRunPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // Data queries
  const { data: encounter, isLoading: encLoading } = useEncounterFull(id)

  const { data: monsterData, isLoading: monstersLoading } = useEncounterMonsters(id)

  const campaignId = encounter?.campaign_id ?? undefined
  const { data: characters, isLoading: charsLoading } = useCampaignCharacters(campaignId)

  // Initialization guard — run setup exactly once when all data is ready
  const initialized = useRef(false)

  // Phase
  const [phase, setPhase] = useState<'loading' | 'setup' | 'combat'>('loading')

  // Setup state
  const [entries, setEntries] = useState<SetupEntry[]>([])

  // Combat state
  const [combatants, setCombatants] = useState<Combatant[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [round, setRound] = useState(1)

  // UI state — popup and add modal
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedCombatant = selectedId ? (combatants.find(c => c.id === selectedId) ?? null) : null

  const [addOpen, setAddOpen] = useState(false)
  const [addForm, setAddForm] = useState<{ name: string; type: 'character' | 'monster'; initiative: string; hpMax: string }>({
    name: '', type: 'monster', initiative: '', hpMax: '',
  })

  // Initialize entries when all queries complete
  const hasCampaignId = !!encounter?.campaign_id
  const allLoaded = !encLoading && !!encounter && !monstersLoading && (!hasCampaignId || !charsLoading)

  useEffect(() => {
    if (!allLoaded || initialized.current) return
    initialized.current = true

    const newEntries: SetupEntry[] = []

    for (const char of characters ?? []) {
      newEntries.push({
        id: char.id,
        type: 'character',
        name: char.name,
        initiativeRoll: '',
        modifier: char.initiative ?? 0,
        hpCurrent: char.hp_current ?? 0,
        hpMax: char.hp_max ?? 0,
        character: char,
      })
    }

    for (const em of monsterData ?? []) {
      const b = em.bestiary
      if (!b) continue
      const mod = abilityModifier(b.stat_dex)
      for (let i = 0; i < em.count; i++) {
        newEntries.push({
          id: `${b.id}-${i}`,
          type: 'monster',
          name: em.count > 1 ? `${b.name} ${i + 1}` : b.name,
          initiativeRoll: '',
          modifier: mod,
          hpCurrent: b.hp,
          hpMax: b.hp,
          bestiary: b,
        })
      }
    }

    setEntries(newEntries)
    setPhase('setup')
  }, [allLoaded]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Setup handlers ─────────────────────────────────────────────────────────

  function updateEntry(entryId: string, field: 'initiativeRoll' | 'hpCurrent' | 'hpMax', value: string) {
    setEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: field === 'hpCurrent' || field === 'hpMax' ? Number(value) : value } : e))
  }

  function rollForEntry(entryId: string) {
    setEntries(prev => prev.map(e =>
      e.id === entryId ? { ...e, initiativeRoll: String(rollD20() + e.modifier) } : e,
    ))
  }

  function rollAll() {
    setEntries(prev => prev.map(e => ({
      ...e,
      initiativeRoll: String(rollD20() + e.modifier),
    })))
  }

  function startCombat() {
    const valid = entries.filter(e => e.initiativeRoll !== '' && !isNaN(parseInt(e.initiativeRoll)))
    const sorted = [...valid].sort((a, b) => parseInt(b.initiativeRoll) - parseInt(a.initiativeRoll))
    const newCombatants: Combatant[] = sorted.map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      initiative: parseInt(e.initiativeRoll),
      hpCurrent: typeof e.hpCurrent === 'number' ? e.hpCurrent : parseInt(String(e.hpCurrent)) || 0,
      hpMax: typeof e.hpMax === 'number' ? e.hpMax : parseInt(String(e.hpMax)) || 1,
      modifier: e.modifier,
      character: e.character,
      bestiary: e.bestiary,
    }))
    setCombatants(newCombatants)
    setActiveIndex(0)
    setRound(1)
    setPhase('combat')
  }

  // ─── Combat handlers ─────────────────────────────────────────────────────────

  function endTurn() {
    if (combatants.length === 0) return
    setActiveIndex(prev => {
      const next = (prev + 1) % combatants.length
      if (next === 0) setRound(r => r + 1)
      return next
    })
  }

  function adjustHp(combatantId: string, delta: number) {
    setCombatants(prev => prev.map(c =>
      c.id === combatantId
        ? { ...c, hpCurrent: Math.max(0, Math.min(c.hpMax, c.hpCurrent + delta)) }
        : c,
    ))
  }

  function removeCombatant(combatantId: string) {
    const idx = combatants.findIndex(c => c.id === combatantId)
    const newList = combatants.filter(c => c.id !== combatantId)
    setSelectedId(null)
    if (newList.length === 0) { setCombatants([]); setActiveIndex(0); return }
    const newActive = idx < activeIndex ? activeIndex - 1 : Math.min(activeIndex, newList.length - 1)
    setCombatants(newList)
    setActiveIndex(newActive % newList.length)
  }

  function addCombatant() {
    if (!addForm.name.trim()) return
    const initiative = parseInt(addForm.initiative) || 0
    const hpMax = Math.max(1, parseInt(addForm.hpMax) || 1)
    const newC: Combatant = {
      id: `manual-${Date.now()}`,
      type: 'manual',
      name: addForm.name.trim(),
      initiative,
      hpCurrent: hpMax,
      hpMax,
      modifier: 0,
    }
    const updated = [...combatants, newC].sort((a, b) => b.initiative - a.initiative)
    const activeId = combatants[activeIndex]?.id
    const newIdx = Math.max(0, updated.findIndex(c => c.id === activeId))
    setCombatants(updated)
    setActiveIndex(newIdx)
    setAddOpen(false)
    setAddForm({ name: '', type: 'monster', initiative: '', hpMax: '' })
  }

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (encLoading || (phase === 'loading' && !!encounter)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Gevecht laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!encounter) {
    return (
      <div>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Gevecht niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>← Dashboard</Button>
      </div>
    )
  }

  // ─── Setup phase ──────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    const charEntries = entries.filter(e => e.type === 'character')
    const monsterEntries = entries.filter(e => e.type === 'monster')
    const someHaveInit = entries.some(e => e.initiativeRoll !== '' && !isNaN(parseInt(e.initiativeRoll)))
    const allHaveInit = entries.length > 0 && entries.every(e => e.initiativeRoll !== '' && !isNaN(parseInt(e.initiativeRoll)))
    const canStart = entries.length === 0 || someHaveInit

    return (
      <div style={{ maxWidth: 680, margin: '0 auto', paddingBottom: 40 }}>
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(`/encounters/${id}`)}
          aria-label="Terug naar gevecht"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'var(--muted)', fontSize: 13, fontFamily: 'var(--font-body)',
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '0 0 24px', transition: 'color var(--t-fast)',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
        >
          ← Terug naar gevecht
        </button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--violet)' }}>
                Initiatief instellen
              </span>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 34px)', fontWeight: 600, color: 'var(--ink)', margin: 0 }}>
              {encounter.name}
            </h1>
          </div>
          {entries.length > 0 && (
            <Button variant="ghost" size="sm" onClick={rollAll}>
              🎲 Alles gooien
            </Button>
          )}
        </div>

        {charEntries.length > 0 && (
          <SetupSection title="Spelers" entries={charEntries} onUpdate={updateEntry} onRoll={rollForEntry} />
        )}
        {monsterEntries.length > 0 && (
          <SetupSection title="Monsters" entries={monsterEntries} onUpdate={updateEntry} onRoll={rollForEntry} />
        )}

        {entries.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)', fontSize: 14, fontStyle: 'italic' }}>
            Geen deelnemers gevonden. Voeg ze handmatig toe na het starten via "+ Toevoegen".
          </div>
        )}

        {!allHaveInit && someHaveInit && entries.length > 0 && (
          <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', margin: '0 0 8px' }}>
            Deelnemers zonder initiatief worden overgeslagen.
          </p>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={startCombat} disabled={!canStart}>
            Start gevecht →
          </Button>
        </div>
      </div>
    )
  }

  // ─── Combat phase ─────────────────────────────────────────────────────────────

  const activeCombatant = combatants[activeIndex] ?? null
  const total = combatants.length

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'var(--void)',
          display: 'flex', flexDirection: 'column',
          zIndex: 60,
        }}
        role="main"
        aria-label="Initiatief tracker"
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px',
          borderBottom: '1px solid var(--hairline)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 17.5L3 6V3h3l11.5 11.5" /><path d="M13 19l6-6" /><path d="M16 16l4 4" /><path d="M19 21l2-2" />
            </svg>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--ink-soft)' }}>
              Initiatief
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)' }}>
              Ronde
            </span>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 600, color: 'var(--gold)', lineHeight: 1 }}>
              {String(round).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* ── Circular carousel ──────────────────────────────────────────────── */}
        <div
          style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 320 }}
          aria-label="Initiatief volgorde"
        >
          {total === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <p style={{ color: 'var(--muted)', fontSize: 14, fontStyle: 'italic' }}>Geen deelnemers. Voeg er een toe.</p>
            </div>
          )}

          {combatants.map((c, i) => {
            const relativeIndex = (i - activeIndex + total) % total
            const angle = total > 1 ? (relativeIndex / total) * 2 * Math.PI - Math.PI / 2 : -Math.PI / 2
            const leftPct = 50 + 40 * Math.cos(angle)
            const topPct = 50 + 38 * Math.sin(angle)
            const isActive = relativeIndex === 0
            const isNear = relativeIndex === 1 || relativeIndex === total - 1
            const scale = isActive ? 1.0 : isNear ? 0.82 : 0.67
            const opacity = isActive ? 1.0 : isNear ? 0.85 : 0.58
            const cardW = isActive ? 82 : isNear ? 66 : 56
            const hpPct = c.hpMax > 0 ? c.hpCurrent / c.hpMax : 0
            const barColor = hpBarColor(c.hpCurrent, c.hpMax)
            const icon = c.type === 'character' ? '✦' : c.type === 'manual' ? '◈' : getMonsterIcon(c.bestiary?.creature_type)
            const iconBg = c.type === 'character' ? 'rgb(var(--violet-rgb) / 0.22)' : 'rgb(var(--crimson-rgb) / 0.22)'
            const iconColor = c.type === 'character' ? 'var(--violet)' : 'var(--crimson)'

            return (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                aria-label={`${c.name}, initiatief ${c.initiative}, HP ${c.hpCurrent} van ${c.hpMax}`}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity,
                  zIndex: isActive ? 10 : isNear ? 6 : 4,
                  transition: 'all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  width: cardW,
                  padding: '8px 8px 7px',
                  borderRadius: 16,
                  border: isActive ? '1px solid rgb(var(--violet-rgb) / 0.55)' : '1px solid var(--hairline)',
                  background: isActive
                    ? 'linear-gradient(175deg, rgb(var(--violet-rgb) / 0.18) 0%, rgb(var(--violet-rgb) / 0.04) 100%)'
                    : 'rgb(var(--surface-rgb) / 0.9)',
                  boxShadow: isActive
                    ? '0 0 30px rgb(var(--violet-rgb) / 0.35), 0 0 10px rgb(var(--violet-rgb) / 0.18)'
                    : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  cursor: 'pointer',
                  backdropFilter: 'blur(6px)',
                }}
              >
                {/* Initiative number */}
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: isActive ? 15 : 12,
                  fontWeight: 700,
                  color: isActive ? 'var(--ink)' : 'var(--ink-soft)',
                  lineHeight: 1,
                }}>
                  {c.initiative}
                </span>

                {/* Icon */}
                <div style={{
                  width: isActive ? 46 : 36,
                  height: isActive ? 46 : 36,
                  borderRadius: '50%',
                  background: iconBg,
                  border: '1px solid rgb(var(--ink-rgb) / 0.07)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isActive ? 19 : 15,
                  color: iconColor,
                  userSelect: 'none',
                }}>
                  {icon}
                </div>

                {/* HP bar */}
                <div style={{ width: '100%', height: 3, borderRadius: 2, background: 'rgb(var(--ink-rgb) / 0.07)' }}>
                  <div style={{
                    width: `${hpPct * 100}%`,
                    height: '100%',
                    borderRadius: 2,
                    background: barColor,
                    transition: 'width 0.3s ease, background 0.3s ease',
                  }} />
                </div>
              </button>
            )
          })}

          {/* ── Center display ───────────────────────────────────────────────── */}
          {activeCombatant && (
            <div style={{
              position: 'absolute', left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              zIndex: 2,
              pointerEvents: 'none',
              width: 'clamp(150px, 34%, 210px)',
            }}>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 9,
                fontWeight: 700, letterSpacing: '0.24em', textTransform: 'uppercase',
                color: 'var(--muted)', margin: '0 0 10px',
              }}>
                Now Acting
              </p>
              <h2 style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 4.5vw, 38px)',
                fontWeight: 600, lineHeight: 1.05,
                color: 'var(--ink)', margin: '0 0 10px',
                textTransform: 'capitalize',
                wordBreak: 'break-word',
              }}>
                {activeCombatant.name}
              </h2>
              <p style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                color: 'var(--gold)', margin: '0 0 16px',
                letterSpacing: '0.06em',
              }}>
                INIT {activeCombatant.initiative} · HP {activeCombatant.hpCurrent}/{activeCombatant.hpMax}
              </p>

              {/* HP controls */}
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center', pointerEvents: 'auto' }}>
                <button
                  onClick={() => adjustHp(activeCombatant.id, -1)}
                  aria-label="HP verminderen"
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: '1px solid var(--hairline-strong)',
                    background: 'rgb(var(--ink-rgb) / 0.04)',
                    color: 'var(--crimson)', fontSize: 14,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background var(--t-fast)',
                    backdropFilter: 'blur(4px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--crimson-rgb) / 0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--ink-rgb) / 0.04)')}
                >
                  ▼
                </button>
                <button
                  onClick={() => adjustHp(activeCombatant.id, +1)}
                  aria-label="HP verhogen"
                  style={{
                    width: 38, height: 38, borderRadius: '50%',
                    border: '1px solid var(--hairline-strong)',
                    background: 'rgb(var(--ink-rgb) / 0.04)',
                    color: 'var(--teal)', fontSize: 14,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background var(--t-fast)',
                    backdropFilter: 'blur(4px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgb(var(--teal-rgb) / 0.18)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgb(var(--ink-rgb) / 0.04)')}
                >
                  ▲
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Bottom bar ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px',
          borderTop: '1px solid var(--hairline)',
          flexShrink: 0,
          gap: 12,
        }}>
          <Button variant="ghost" onClick={() => setAddOpen(true)}>
            + Toevoegen
          </Button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => { initialized.current = false; setPhase('setup') }}
              aria-label="Opnieuw instellen"
              style={{
                padding: '8px 14px', borderRadius: 8,
                border: '1px solid var(--hairline-strong)',
                background: 'none', color: 'var(--muted)', fontSize: 12,
                fontFamily: 'var(--font-body)', fontWeight: 700,
                letterSpacing: '0.06em', cursor: 'pointer',
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--ink-soft)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
            >
              ↺ Opnieuw
            </button>
            <Button variant="primary" onClick={endTurn} disabled={combatants.length === 0}>
              Volgende beurt →
            </Button>
          </div>
        </div>
      </div>

      {/* ── Stats popup ────────────────────────────────────────────────────────── */}
      <Modal
        open={!!selectedId && !!selectedCombatant}
        onClose={() => setSelectedId(null)}
        title={selectedCombatant?.name ?? ''}
        className="max-w-xl"
      >
        {selectedCombatant && (
          <>
            {selectedCombatant.type === 'character' && selectedCombatant.character ? (
              <CharacterStatPopup
                character={selectedCombatant.character}
                hpCurrent={selectedCombatant.hpCurrent}
                onAdjustHp={d => adjustHp(selectedCombatant.id, d)}
              />
            ) : selectedCombatant.type === 'monster' && selectedCombatant.bestiary ? (
              <MonsterStatPopup
                bestiary={selectedCombatant.bestiary}
                hpCurrent={selectedCombatant.hpCurrent}
                hpMax={selectedCombatant.hpMax}
                onAdjustHp={d => adjustHp(selectedCombatant.id, d)}
              />
            ) : (
              <ManualStatPopup combatant={selectedCombatant} onAdjustHp={d => adjustHp(selectedCombatant.id, d)} />
            )}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--hairline)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="danger" size="sm" onClick={() => removeCombatant(selectedCombatant.id)}>
                Verwijder uit tracker
              </Button>
            </div>
          </>
        )}
      </Modal>

      {/* ── Add combatant modal ───────────────────────────────────────────────── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Deelnemer toevoegen">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
              Naam
            </label>
            <input
              type="text"
              value={addForm.name}
              onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Bijv. Bandiet 4"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'var(--surface-2)', border: '1px solid var(--hairline-strong)',
                borderRadius: 8, padding: '9px 12px',
                fontSize: 14, color: 'var(--ink)', fontFamily: 'var(--font-body)',
                outline: 'none',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--violet)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
              onKeyDown={e => { if (e.key === 'Enter') addCombatant() }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Type
              </label>
              <select
                value={addForm.type}
                onChange={e => setAddForm(f => ({ ...f, type: e.target.value as 'character' | 'monster' }))}
                style={{
                  width: '100%',
                  background: 'var(--surface-2)', border: '1px solid var(--hairline-strong)',
                  borderRadius: 8, padding: '9px 10px',
                  fontSize: 13, color: 'var(--ink)', fontFamily: 'var(--font-body)',
                  outline: 'none', cursor: 'pointer',
                }}
              >
                <option value="character">Speler</option>
                <option value="monster">Monster</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Initiatief
              </label>
              <input
                type="number"
                value={addForm.initiative}
                onChange={e => setAddForm(f => ({ ...f, initiative: e.target.value }))}
                placeholder="0"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface-2)', border: '1px solid var(--hairline-strong)',
                  borderRadius: 8, padding: '9px 10px',
                  fontSize: 14, fontWeight: 700, color: 'var(--ink)', textAlign: 'center',
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--violet)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Max HP
              </label>
              <input
                type="number"
                value={addForm.hpMax}
                onChange={e => setAddForm(f => ({ ...f, hpMax: e.target.value }))}
                placeholder="1"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--surface-2)', border: '1px solid var(--hairline-strong)',
                  borderRadius: 8, padding: '9px 10px',
                  fontSize: 14, fontWeight: 700, color: 'var(--teal)', textAlign: 'center',
                  fontFamily: 'var(--font-body)', outline: 'none',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--hairline-strong)')}
                onKeyDown={e => { if (e.key === 'Enter') addCombatant() }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>Annuleren</Button>
            <Button variant="primary" onClick={addCombatant} disabled={!addForm.name.trim()}>
              Toevoegen
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
