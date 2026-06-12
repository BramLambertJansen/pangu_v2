import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { SpellSlots } from '@/components/character/SpellSlots'
import { spellSchoolLabel, spellSchoolColor } from '@/lib/statusMaps'
import {
  useCharacterSpells,
  useAddCharacterSpell,
  useRemoveCharacterSpell,
  useToggleSpellPrepared,
} from '@/hooks/queries/useCharacterSpells'
import { useSpells } from '@/hooks/queries/useSpells'
import { useUpdateCharacterSpellSlot } from '@/hooks/queries/useCharacter'
import { SPELLCASTING_ABILITY_LABELS } from '@/utils/dnd5e'
import type { EffectiveStats } from '@/utils/equipmentUtils'
import type { Character, SpellSlots as SpellSlotsType } from '@/types/character.types'

interface Props {
  characterId: string
  character: Character
  eff: EffectiveStats
}

export function CharacterSpellsTab({ characterId, character, eff }: Props) {
  const navigate = useNavigate()
  const [spellPickerOpen, setSpellPickerOpen]   = useState(false)
  const [expandedSpellId, setExpandedSpellId]   = useState<string | null>(null)
  const [spellPickerQuery, setSpellPickerQuery] = useState('')

  const { data: characterSpells, isLoading: isLoadingCharacterSpells } = useCharacterSpells(characterId)
  const { data: spellLibrary } = useSpells()
  const addCharacterSpell    = useAddCharacterSpell(characterId)
  const removeCharacterSpell = useRemoveCharacterSpell(characterId)
  const toggleSpellPrepared  = useToggleSpellPrepared(characterId)
  const updateSpellSlot      = useUpdateCharacterSpellSlot(characterId)

  const profBonus        = character.proficiency_bonus ?? 2
  const spellAbility     = character.spellcasting_ability ?? null
  const spellAbilityScore = spellAbility === 'int' ? eff.int : spellAbility === 'wis' ? eff.wis : eff.cha
  const spellAbilityMod  = Math.floor((spellAbilityScore - 10) / 2)
  const spellSaveDC      = spellAbility ? 8 + profBonus + spellAbilityMod : null
  const spellAttackBonus = spellAbility ? profBonus + spellAbilityMod : null
  const spellSlots       = (character.spell_slots ?? {}) as SpellSlotsType
  const slotsArray = Array.from({ length: 9 }, (_, i) => spellSlots[String(i + 1) as keyof SpellSlotsType]?.max ?? 0)
  const usedArray  = Array.from({ length: 9 }, (_, i) => {
    const s = spellSlots[String(i + 1) as keyof SpellSlotsType]
    return s ? s.max - s.current : 0
  })

  return (
    <div id="tabpanel-spreuken" role="tabpanel" aria-labelledby="tab-spreuken">
      {!spellAbility ? (
        <EmptyState
          icon="✦"
          title="Geen toverbaarheid"
          description="Stel een toverbaarheids-eigenschap in om spreukslots en spreuken te beheren."
          action={
            <Button variant="secondary" size="sm" onClick={() => navigate(`/characters/${characterId}/edit`)}>
              Naar bewerken
            </Button>
          }
        />
      ) : (
        <div>
          {/* Spellcasting header */}
          <div className="pangu-surface" style={{ padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>Toverbaarheid</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--violet)', margin: 0 }}>
                  {SPELLCASTING_ABILITY_LABELS[spellAbility]}
                </p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>Spreuk-DC</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{spellSaveDC}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>Spreukenaanval</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                  {spellAttackBonus !== null ? (spellAttackBonus >= 0 ? `+${spellAttackBonus}` : `${spellAttackBonus}`) : '—'}
                </p>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>Concentratie</p>
                {character.concentrating ? (
                  <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgb(var(--teal-rgb) / 0.1)', border: '1px solid rgb(var(--teal-rgb) / 0.4)' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--teal)', margin: 0 }}>
                      ◉ {character.concentration_spell ?? 'Concentreert...'}
                    </p>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen concentratie</p>
                )}
              </div>
            </div>
          </div>

          {/* Spell slots */}
          <div className="pangu-surface" style={{ padding: 24 }}>
            <p className="pangu-section-title" style={{ marginBottom: 4 }}>Spreukslots</p>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 16 }}>
              Klik op een slot om het te gebruiken of te herstellen.
            </p>
            {Object.keys(spellSlots).length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                Stel spreukslots in via{' '}
                <a href={`/characters/${characterId}/edit`} style={{ color: 'var(--violet)', textDecoration: 'none' }}>Bewerken</a>.
              </p>
            ) : (
              <SpellSlots
                slots={slotsArray}
                used={usedArray}
                pending={updateSpellSlot.isPending}
                onToggle={(level, pipIndex) => {
                  const levelKey = String(level) as keyof SpellSlotsType
                  const s = spellSlots[levelKey]
                  if (!s) return
                  const isExpended = pipIndex < usedArray[level - 1]
                  updateSpellSlot.mutate({
                    level: levelKey,
                    current: isExpended ? s.current + 1 : s.current - 1,
                    currentSlots: character.spell_slots ?? {} as SpellSlotsType,
                  })
                }}
              />
            )}
          </div>

          {/* Known spells */}
          <div className="pangu-surface" style={{ padding: 24, marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p className="pangu-section-title" style={{ margin: 0 }}>Gekende Spreuken</p>
              <button
                type="button"
                onClick={() => { setSpellPickerOpen(v => !v); setSpellPickerQuery('') }}
                aria-expanded={spellPickerOpen}
                aria-controls="spell-picker"
                aria-label="Spreuk toevoegen aan karakter"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  background: 'rgb(var(--violet-rgb) / 0.08)',
                  border: '1px solid rgb(var(--violet-rgb) / 0.3)',
                  borderRadius: 'var(--r-full)',
                  color: 'var(--violet)',
                  fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  cursor: 'pointer', transition: 'all var(--t-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgb(var(--violet-rgb) / 0.08)' }}
              >
                <span aria-hidden="true">+</span> Toevoegen
              </button>
            </div>

            {/* Spell picker */}
            {spellPickerOpen && (
              <div id="spell-picker" style={{ marginBottom: 20, padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--hairline)' }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>
                  Spreuk uit bibliotheek
                </p>
                {(spellLibrary ?? []).length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>
                    Je bibliotheek is leeg. Importeer spreuken via{' '}
                    <a href="/spells" style={{ color: 'var(--violet)', textDecoration: 'none' }}>Spreuken</a>.
                  </p>
                ) : (() => {
                  const q = spellPickerQuery.toLowerCase()
                  const filtered = (spellLibrary ?? []).filter(s =>
                    !q || s.name.toLowerCase().includes(q) || spellSchoolLabel[s.school].toLowerCase().includes(q)
                  )
                  return (
                    <>
                      <input
                        type="search"
                        placeholder="Zoek op naam of school…"
                        value={spellPickerQuery}
                        onChange={e => setSpellPickerQuery(e.target.value)}
                        aria-label="Spreuk zoeken"
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '7px 10px', marginBottom: 10,
                          background: 'var(--void-2)', border: '1px solid var(--hairline)',
                          borderRadius: 6, color: 'var(--ink)', fontSize: 13,
                          fontFamily: 'var(--font-body)',
                        }}
                      />
                      {filtered.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen spreuken gevonden.</p>
                      ) : (
                        <ul
                          style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}
                          role="list"
                          aria-label="Spreuken uit bibliotheek"
                        >
                          {filtered.map(spell => {
                            const alreadyAdded = (characterSpells ?? []).some(cs => cs.spell_id === spell.id)
                            return (
                              <li key={spell.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '4px 0' }}>
                                <span style={{ fontSize: 13, color: alreadyAdded ? 'var(--muted)' : 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: alreadyAdded ? 'var(--muted)' : spellSchoolColor[spell.school], marginRight: 6 }}>
                                    {spell.level === 0 ? 'Kantrip' : `Niv ${spell.level}`}
                                  </span>
                                  {spell.name}
                                </span>
                                {alreadyAdded ? (
                                  <span style={{ fontSize: 10, color: 'var(--muted)', fontStyle: 'italic', flexShrink: 0 }}>✓ Toegevoegd</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addCharacterSpell.mutate(spell.id)}
                                    disabled={addCharacterSpell.isPending}
                                    aria-label={`${spell.name} toevoegen`}
                                    style={{
                                      flexShrink: 0, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                                      letterSpacing: '0.1em', textTransform: 'uppercase',
                                      border: '1px solid rgb(var(--violet-rgb) / 0.4)',
                                      borderRadius: 4, background: 'transparent',
                                      color: 'var(--violet)', cursor: 'pointer',
                                    }}
                                  >
                                    Voeg toe
                                  </button>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </>
                  )
                })()}
              </div>
            )}

            {/* Known spells grouped by level */}
            {isLoadingCharacterSpells ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }} aria-live="polite" aria-busy="true">
                <Spinner size="sm" />
              </div>
            ) : (characterSpells ?? []).length === 0 ? (
              <EmptyState
                icon="✦"
                title="Nog geen spreuken"
                description="Voeg spreuken uit je bibliotheek toe aan dit karakter."
                action={
                  !spellPickerOpen && (
                    <Button variant="secondary" size="sm" onClick={() => { setSpellPickerOpen(true); setSpellPickerQuery('') }}>
                      + Spreuk toevoegen
                    </Button>
                  )
                }
              />
            ) : (() => {
              const grouped = new Map<number, typeof characterSpells>()
              for (const entry of characterSpells ?? []) {
                const lvl = entry.spell.level
                if (!grouped.has(lvl)) grouped.set(lvl, [])
                grouped.get(lvl)!.push(entry)
              }
              const levels = Array.from(grouped.keys()).sort((a, b) => a - b)
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {levels.map(level => {
                    const entries = grouped.get(level)!
                    const isCantrip = level === 0
                    return (
                      <div key={level}>
                        <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', borderBottom: '1px solid var(--hairline)', paddingBottom: 6 }}>
                          {isCantrip ? 'Kantrippen' : `Niveau ${level} spreuken`}
                          <span style={{ marginLeft: 8, fontWeight: 400 }}>({entries.length})</span>
                        </p>
                        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }} role="list" aria-label={isCantrip ? 'Kantrippen' : `Niveau ${level} spreuken`}>
                          {entries.map(entry => {
                            const spell = entry.spell
                            const isExpanded = expandedSpellId === entry.id
                            return (
                              <li key={entry.id} style={{ borderRadius: 8, border: '1px solid var(--hairline)', overflow: 'hidden' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--surface)' }}>
                                  {!isCantrip && (
                                    <button
                                      type="button"
                                      onClick={() => toggleSpellPrepared.mutate({ entryId: entry.id, prepared: !entry.prepared })}
                                      disabled={toggleSpellPrepared.isPending}
                                      title={entry.prepared ? 'Voorbereid — klik om uit te schakelen' : 'Niet voorbereid — klik om voor te bereiden'}
                                      aria-label={entry.prepared ? `${spell.name} niet meer voorbereiden` : `${spell.name} voorbereiden`}
                                      aria-pressed={entry.prepared}
                                      style={{
                                        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                                        border: entry.prepared ? '2px solid rgb(var(--violet-rgb) / 0.6)' : '2px solid var(--hairline-strong)',
                                        background: entry.prepared ? 'rgb(var(--violet-rgb) / 0.12)' : 'transparent',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        transition: 'all var(--t-fast)',
                                      }}
                                    >
                                      <span aria-hidden="true" style={{ fontSize: 13, color: entry.prepared ? 'var(--violet)' : 'var(--muted)' }}>
                                        {entry.prepared ? '✦' : '○'}
                                      </span>
                                    </button>
                                  )}

                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ margin: '0 0 1px', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: spellSchoolColor[spell.school] }}>
                                      {spellSchoolLabel[spell.school]}
                                      {spell.concentration && <span style={{ marginLeft: 6, color: 'var(--gold)' }} title="Concentratie vereist">C</span>}
                                      {spell.ritual && <span style={{ marginLeft: 4, color: 'var(--teal)' }} title="Ritueel">R</span>}
                                    </p>
                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {spell.name}
                                    </p>
                                  </div>

                                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>
                                    {spell.casting_time && <span>{spell.casting_time}</span>}
                                    {spell.range && <span>{spell.range}</span>}
                                  </div>

                                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                                    {spell.description && (
                                      <button
                                        type="button"
                                        onClick={() => setExpandedSpellId(isExpanded ? null : entry.id)}
                                        aria-expanded={isExpanded}
                                        aria-label={isExpanded ? `${spell.name} inklappen` : `${spell.name} uitklappen`}
                                        style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                      >
                                        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--t-fast)' }}>
                                          <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => removeCharacterSpell.mutate(entry.id)}
                                      disabled={removeCharacterSpell.isPending}
                                      aria-label={`${spell.name} verwijderen`}
                                      style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                                      onMouseEnter={e => { e.currentTarget.style.color = 'var(--crimson)' }}
                                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
                                    >
                                      <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>

                                {isExpanded && spell.description && (
                                  <div style={{ padding: '12px 14px', borderTop: '1px solid var(--hairline)', background: 'var(--void-2)' }}>
                                    <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                      {spell.description}
                                    </p>
                                    {spell.higher_level && (
                                      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8, marginBottom: 0 }}>
                                        <strong>Op hogere niveaus:</strong> {spell.higher_level}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
