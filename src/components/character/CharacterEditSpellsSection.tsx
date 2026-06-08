import { useId } from 'react'
import { NumericField, TagInput } from '@/components/character/CharacterEditHelpers'
import { SPELL_LEVELS } from '@/utils/dnd5e'
import type { Character, SpellcastingAbility, SpellSlots, SpellSlotLevel, ClassResources } from '@/types/character.types'
import { Button } from '@/components/ui/Button'

const SPELLCASTING_ABILITY_OPTIONS: { value: SpellcastingAbility; label: string }[] = [
  { value: 'int', label: 'Intelligentie (INT)' },
  { value: 'wis', label: 'Wijsheid (WIS)' },
  { value: 'cha', label: 'Charisma (CHA)' },
]

const CLASS_RESOURCE_PRESETS = [
  'Ki-punten', 'Woede', 'Bardische Inspiratie', 'Superioriteitsdob belstenen',
  'Toverijpunten', 'Goddelijke gunst', 'Wilde gedaante', 'Sluipaanval',
]

const WEAPON_MASTERY_PRESETS = ['Splijten', 'Schrammen', 'Kerven', 'Duwen', 'Uitputten', 'Vertragen', 'Omverwerpen', 'Plagen']

interface Props {
  form: Character
  set: <K extends keyof Character>(key: K, value: Character[K] | null) => void
}

export function CharacterEditSpellsSection({ form, set }: Props) {
  const concentrationSpellId = useId()
  const featsId = useId()
  const weaponMasteriesId = useId()

  const proficiency = form.proficiency_bonus ?? 2
  const spellAbility = form.spellcasting_ability ?? null
  const spellAbilityMod = (() => {
    if (!spellAbility) return 0
    const score = spellAbility === 'int' ? (form.stat_int ?? 10)
                : spellAbility === 'wis' ? (form.stat_wis ?? 10)
                : (form.stat_cha ?? 10)
    return Math.floor((score - 10) / 2)
  })()
  const spellSaveDC      = spellAbility ? 8 + proficiency + spellAbilityMod : null
  const spellAttackBonus = spellAbility ? proficiency + spellAbilityMod : null

  function getSlot(level: string): SpellSlotLevel {
    const slots = (form.spell_slots ?? {}) as SpellSlots
    return slots[level as keyof SpellSlots] ?? { current: 0, max: 0 }
  }
  function setSlot(level: string, field: 'current' | 'max', value: number) {
    const slots = { ...(form.spell_slots ?? {}) } as SpellSlots
    const existing = slots[level as keyof SpellSlots] ?? { current: 0, max: 0 }
    const updated = { ...existing, [field]: Math.max(0, value) }
    if (updated.max === 0 && updated.current === 0) {
      const { [level as keyof SpellSlots]: _, ...rest } = slots
      set('spell_slots', rest)
    } else {
      set('spell_slots', { ...slots, [level]: updated })
    }
  }

  function getClassResources(): ClassResources {
    return (form.class_resources ?? {}) as ClassResources
  }
  function setResourceField(name: string, field: 'current' | 'max', value: number) {
    const resources = { ...getClassResources() }
    resources[name] = { ...resources[name], [field]: Math.max(0, value) }
    set('class_resources', resources)
  }
  function addResource(name: string) {
    const trimmed = name.trim()
    if (!trimmed) return
    const resources = getClassResources()
    if (resources[trimmed]) return
    set('class_resources', { ...resources, [trimmed]: { current: 0, max: 0 } })
  }
  function removeResource(name: string) {
    const { [name]: _, ...rest } = getClassResources()
    set('class_resources', rest)
  }

  return (
    <>
      {/* ── Schatkist ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <NumericField id="char-platinum" label="Platina (pp)"  value={form.platinum ?? 0} onChange={(v) => set('platinum', Math.max(0, v))} />
          <NumericField id="char-gold"     label="Goud (gp)"     value={form.gold ?? 0}     onChange={(v) => set('gold',     Math.max(0, v))} />
          <NumericField id="char-electrum" label="Elektrum (ep)" value={form.electrum ?? 0} onChange={(v) => set('electrum', Math.max(0, v))} />
          <NumericField id="char-silver"   label="Zilver (sp)"   value={form.silver ?? 0}   onChange={(v) => set('silver',   Math.max(0, v))} />
          <NumericField id="char-copper"   label="Koper (cp)"    value={form.copper ?? 0}   onChange={(v) => set('copper',   Math.max(0, v))} />
        </div>
      </div>

      {/* ── Spreuken ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Spreuken</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
          Stel je toverbaarheids-eigenschap in en pas je spreukslots aan per niveau.
        </p>

        {/* Spellcasting ability */}
        <div style={{ marginBottom: 20 }}>
          <label className="pangu-label" htmlFor="char-spell-ability">Toverbaarheids-eigenschap</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <button
              type="button"
              onClick={() => set('spellcasting_ability', null)}
              style={{
                padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                background: !spellAbility ? 'rgb(var(--violet-rgb) / 0.15)' : 'var(--surface)',
                border: !spellAbility ? '1px solid rgb(var(--violet-rgb) / 0.4)' : '1px solid var(--hairline)',
                color: !spellAbility ? 'var(--violet)' : 'var(--ink-soft)',
                fontWeight: !spellAbility ? 600 : 400,
              }}
            >
              Geen
            </button>
            {SPELLCASTING_ABILITY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set('spellcasting_ability', opt.value)}
                style={{
                  padding: '7px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13,
                  background: spellAbility === opt.value ? 'rgb(var(--violet-rgb) / 0.15)' : 'var(--surface)',
                  border: spellAbility === opt.value ? '1px solid rgb(var(--violet-rgb) / 0.4)' : '1px solid var(--hairline)',
                  color: spellAbility === opt.value ? 'var(--violet)' : 'var(--ink-soft)',
                  fontWeight: spellAbility === opt.value ? 600 : 400,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {spellAbility && (
            <div style={{ display: 'flex', gap: 24, marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgb(var(--violet-rgb) / 0.06)', border: '1px solid rgb(var(--violet-rgb) / 0.2)' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>Spreuk-DC</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--violet)', margin: 0 }}>{spellSaveDC}</p>
              </div>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>Spreukenaanval</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--violet)', margin: 0 }}>{spellAttackBonus !== null ? (spellAttackBonus >= 0 ? `+${spellAttackBonus}` : `${spellAttackBonus}`) : '—'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Concentratie */}
        <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p className="pangu-label" style={{ marginBottom: 8 }}>Concentratie</p>
            <button
              type="button"
              aria-pressed={form.concentrating ?? false}
              onClick={() => set('concentrating', !(form.concentrating ?? false))}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
                background: (form.concentrating ?? false) ? 'rgb(var(--teal-rgb) / 0.1)' : 'var(--surface)',
                border: (form.concentrating ?? false) ? '1px solid rgb(var(--teal-rgb) / 0.4)' : '1px solid var(--hairline)',
                color: (form.concentrating ?? false) ? 'var(--teal)' : 'var(--ink-soft)',
                fontWeight: (form.concentrating ?? false) ? 600 : 400, fontSize: 13,
              }}
            >
              <span aria-hidden="true">{(form.concentrating ?? false) ? '◉' : '○'}</span>
              {(form.concentrating ?? false) ? 'Concentreert' : 'Geen concentratie'}
            </button>
          </div>
          {(form.concentrating ?? false) && (
            <div style={{ flex: 1, minWidth: 200 }}>
              <label className="pangu-label" htmlFor={concentrationSpellId}>Op welke spreuk?</label>
              <input
                id={concentrationSpellId}
                className="pangu-input"
                value={form.concentration_spell ?? ''}
                onChange={(e) => set('concentration_spell', e.target.value || null)}
                placeholder="Naam van de spreuk..."
              />
            </div>
          )}
        </div>

        {/* Spread slots per niveau */}
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginBottom: 10 }}>
          Spreukslots per niveau
        </p>
        <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
          Stel "Max" in op het maximale aantal slots voor dat niveau. Stel "Huidig" in op het aantal dat nog beschikbaar is.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SPELL_LEVELS.map(level => {
            const slot = getSlot(level)
            if (slot.max === 0 && level !== '1') {
              // Show collapsed row for empty levels above 1
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setSlot(level, 'max', 1)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
                    background: 'var(--surface)', border: '1px dashed var(--hairline)',
                    color: 'var(--muted)', fontSize: 12, textAlign: 'left',
                  }}
                >
                  <span>+</span>
                  <span>Niveau {level} toevoegen</span>
                </button>
              )
            }
            return (
              <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: slot.max > 0 ? 'rgb(var(--violet-rgb) / 0.06)' : 'var(--surface)', border: slot.max > 0 ? '1px solid rgb(var(--violet-rgb) / 0.2)' : '1px solid var(--hairline)' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--muted)', minWidth: 60 }}>Niv. {level}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Huidig</span>
                  <input
                    type="number"
                    min={0}
                    max={slot.max}
                    value={slot.current}
                    onChange={(e) => setSlot(level, 'current', parseInt(e.target.value, 10) || 0)}
                    style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>/</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Max</span>
                  <input
                    type="number"
                    min={0}
                    max={9}
                    value={slot.max}
                    onChange={(e) => setSlot(level, 'max', parseInt(e.target.value, 10) || 0)}
                    style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--ink)', fontSize: 13, textAlign: 'center' }}
                  />
                </div>
                {slot.max > 0 && (
                  <button
                    type="button"
                    aria-label={`Niveau ${level} verwijderen`}
                    onClick={() => setSlot(level, 'max', 0)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '2px 6px' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Klasseresources ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Klasseresources</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
          Bijhouden van klasse-specifieke hulpbronnen zoals ki-punten, woede, bardische inspiratie, etc.
        </p>
        {/* Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
          {CLASS_RESOURCE_PRESETS.map(preset => {
            const resources = getClassResources()
            const active = preset in resources
            return (
              <button
                key={preset}
                type="button"
                onClick={() => active ? removeResource(preset) : addResource(preset)}
                style={{
                  fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                  border: active ? '1px solid rgb(var(--teal-rgb) / 0.4)' : '1px solid var(--hairline)',
                  background: active ? 'rgb(var(--teal-rgb) / 0.1)' : 'var(--surface)',
                  color: active ? 'var(--teal)' : 'var(--ink-soft)',
                  transition: 'all var(--t-fast)',
                }}
              >
                {active ? '✓ ' : '+ '}{preset}
              </button>
            )
          })}
        </div>
        {/* Custom resource input */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            id="custom-resource-input"
            className="pangu-input"
            placeholder="Eigen resource naam..."
            style={{ flex: 1 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addResource((e.currentTarget as HTMLInputElement).value)
                ;(e.currentTarget as HTMLInputElement).value = ''
              }
            }}
          />
          <Button variant="ghost" size="sm"
            onClick={() => {
              const inp = document.getElementById('custom-resource-input') as HTMLInputElement
              if (inp) { addResource(inp.value); inp.value = '' }
            }}
          >
            Toevoegen
          </Button>
        </div>
        {/* Resource rows */}
        {Object.entries(getClassResources()).length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.entries(getClassResources()).map(([name, res]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{name}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Huidig</span>
                  <input
                    type="number" min={0} max={res.max || 999}
                    value={res.current}
                    onChange={(e) => setResourceField(name, 'current', parseInt(e.target.value, 10) || 0)}
                    style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--void)', color: 'var(--ink)', fontSize: 13, textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>/</span>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>Max</span>
                  <input
                    type="number" min={0}
                    value={res.max}
                    onChange={(e) => setResourceField(name, 'max', parseInt(e.target.value, 10) || 0)}
                    style={{ width: 52, padding: '4px 6px', borderRadius: 6, border: '1px solid var(--hairline)', background: 'var(--void)', color: 'var(--ink)', fontSize: 13, textAlign: 'center' }}
                  />
                </div>
                <button
                  type="button"
                  aria-label={`${name} verwijderen`}
                  onClick={() => removeResource(name)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '2px 6px' }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Talenten & Wapenmeesters ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 20 }}>Talenten &amp; Wapenmeesters</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TagInput
            id={featsId}
            label="Talenten (Feats)"
            values={form.feats ?? []}
            onChange={(v) => set('feats', v)}
            placeholder="Bijv. Alert, Tough, War Caster, Sentinel..."
          />
          <TagInput
            id={weaponMasteriesId}
            label="Wapenmeesters (Weapon Masteries)"
            values={form.weapon_masteries ?? []}
            onChange={(v) => set('weapon_masteries', v)}
            placeholder="Kies of typ een meesterproef..."
            presets={WEAPON_MASTERY_PRESETS}
          />
        </div>
      </div>
    </>
  )
}
