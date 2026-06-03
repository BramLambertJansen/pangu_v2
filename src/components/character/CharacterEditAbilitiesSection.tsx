import { NumericField, TagInput } from '@/components/character/CharacterEditHelpers'
import { D5E_SKILLS as SKILLS, D5E_SAVING_THROWS as SAVING_THROWS, ABILITY_SCORES } from '@/utils/dnd5e'
import type { Character } from '@/types/character.types'
import { useId } from 'react'

const LANGUAGES_PRESET = [
  'Gemeen', 'Elfisch', 'Dwergs', 'Halflings', 'Gnooms', 'Orks',
  'Draconisch', 'Diefspreuk', 'Abyssal', 'Infernaal', 'Celestisch',
  'Sylvaans', 'Primordiaal', 'Onderd',
]

const WEAPON_PROF_PRESETS = ['Eenvoudige wapens', 'Martiale wapens']
const ARMOR_PROF_PRESETS  = ['Lichte wapenrusting', 'Gemiddelde wapenrusting', 'Zware wapenrusting', 'Schilden']

interface Props {
  form: Character
  set: (key: keyof Character, value: unknown) => void
  cycleSkill: (skillName: string) => void
  toggleSavingThrow: (abilityLabel: string) => void
}

export function CharacterEditAbilitiesSection({ form, set, cycleSkill, toggleSavingThrow }: Props) {
  const languagesId = useId()
  const weaponProfId = useId()
  const armorProfId = useId()
  const toolProfId = useId()

  const proficiency = form.proficiency_bonus ?? 2

  return (
    <>
      {/* ── Eigenschappen ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Eigenschappen</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {ABILITY_SCORES.map(({ key, abbr, label }) => (
            <NumericField
              key={key}
              id={`char-${key}`}
              label={`${label} (${abbr})`}
              value={(form[key] as number) ?? 10}
              onChange={(v) => set(key, Math.min(30, Math.max(1, v)))}
              min={1}
              max={30}
            />
          ))}
        </div>
      </div>

      {/* ── Reddingsgooien ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Reddingsgooien</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
          Klik om een reddingsgooi-vaardigheid aan te zetten. Vaardigheidsbonus (+{proficiency}) wordt automatisch meegeteld.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
          {SAVING_THROWS.map((save) => {
            const saveProficiencies: string[] = form.saving_throw_proficiencies ?? []
            const isProficient = saveProficiencies.includes(save.label)
            return (
              <button
                key={save.label}
                type="button"
                onClick={() => toggleSavingThrow(save.label)}
                aria-pressed={isProficient}
                aria-label={`${save.label} reddingsgooi: ${isProficient ? 'vaardig' : 'niet vaardig'}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                  border: isProficient ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--hairline)',
                  transition: 'background var(--t-fast), border-color var(--t-fast)',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 10, height: 10,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isProficient ? 'var(--violet)' : 'transparent',
                    border: `2px solid ${isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                    transition: 'background var(--t-fast), border-color var(--t-fast)',
                  }}
                />
                <div>
                  <span style={{ fontSize: 13, color: isProficient ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: isProficient ? 600 : 400 }}>
                    {save.abbr}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5 }}>
                    {save.label}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Vaardigheden ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
          1× klik = vaardig (+{proficiency}), 2× klik = expertise (×2 bonus), 3× klik = geen.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {SKILLS.map((skill) => {
            const proficients: string[] = form.proficient_skills ?? []
            const experts: string[] = form.expertise_skills ?? []
            const isProficient = proficients.includes(skill.name)
            const isExpert = experts.includes(skill.name)
            const state = isExpert ? 'expertise' : isProficient ? 'vaardig' : 'geen'
            return (
              <button
                key={skill.name}
                type="button"
                onClick={() => cycleSkill(skill.name)}
                aria-label={`${skill.name} (${skill.abbr}): ${state}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isExpert
                    ? 'rgba(62,207,178,0.08)'
                    : isProficient
                      ? 'rgba(139,92,246,0.08)'
                      : 'var(--surface)',
                  border: isExpert
                    ? '1px solid rgba(62,207,178,0.35)'
                    : isProficient
                      ? '1px solid rgba(139,92,246,0.3)'
                      : '1px solid var(--hairline)',
                  transition: 'background var(--t-fast), border-color var(--t-fast)',
                }}
              >
                {/* Three-state dot indicator */}
                <span
                  aria-hidden="true"
                  style={{
                    position: 'relative',
                    width: 12, height: 12,
                    borderRadius: '50%',
                    flexShrink: 0,
                    background: isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'transparent',
                    border: `2px solid ${isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                    boxShadow: isExpert ? '0 0 0 2px rgba(62,207,178,0.3)' : 'none',
                    transition: 'background var(--t-fast), border-color var(--t-fast), box-shadow var(--t-fast)',
                  }}
                />
                <span style={{
                  flex: 1,
                  fontSize: 13,
                  color: isExpert ? 'var(--teal)' : isProficient ? 'var(--ink)' : 'var(--ink-soft)',
                  fontWeight: (isProficient || isExpert) ? 600 : 400,
                }}>
                  {skill.name}
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5, fontWeight: 400 }}>
                    {skill.abbr}
                  </span>
                  {isExpert && (
                    <span style={{ fontSize: 9, color: 'var(--teal)', marginLeft: 5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      EXP
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Bekwaamheden & Talen ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Bekwaamheden &amp; Talen</p>
        <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 24 }}>
          Klik op een taal of categorie om toe te voegen, of typ vrij en druk op Enter.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <TagInput
            id={languagesId}
            label="Talen"
            values={form.languages ?? []}
            onChange={(v) => set('languages', v)}
            placeholder="Typ een taal en druk op Enter..."
            presets={LANGUAGES_PRESET}
          />
          <TagInput
            id={weaponProfId}
            label="Wapenbekwaamheden"
            values={form.weapon_proficiencies ?? []}
            onChange={(v) => set('weapon_proficiencies', v)}
            placeholder="Bijv. Eenvoudige wapens, Korte zwaard..."
            presets={WEAPON_PROF_PRESETS}
          />
          <TagInput
            id={armorProfId}
            label="Wapenrustingbekwaamheden"
            values={form.armor_proficiencies ?? []}
            onChange={(v) => set('armor_proficiencies', v)}
            placeholder="Bijv. Lichte wapenrusting, Schilden..."
            presets={ARMOR_PROF_PRESETS}
          />
          <TagInput
            id={toolProfId}
            label="Gereedschapsbekwaamheden"
            values={form.tool_proficiencies ?? []}
            onChange={(v) => set('tool_proficiencies', v)}
            placeholder="Bijv. Dievenwerktuigen, Herbalism kit, Smid..."
          />
        </div>
      </div>
    </>
  )
}
