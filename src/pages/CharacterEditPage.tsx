import { useId, useCallback, useRef, KeyboardEvent } from 'react'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import { useImagePositioning } from '@/hooks/useImagePositioning'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useAuthStore } from '@/stores/auth.store'
import type { Character, CharacterStatus, HitDie, SpellcastingAbility, SpellSlots, SpellSlotLevel, ClassResources } from '@/types/character.types'
import type { Campaign } from '@/types/campaign.types'

const SKILLS: { name: string; ability: string; abbr: string }[] = [
  { name: 'Atletiek',          ability: 'Sterkte',       abbr: 'STR' },
  { name: 'Acrobatiek',        ability: 'Behendigheid',  abbr: 'DEX' },
  { name: 'Vingervlugheid',    ability: 'Behendigheid',  abbr: 'DEX' },
  { name: 'Sluipen',           ability: 'Behendigheid',  abbr: 'DEX' },
  { name: 'Magie',             ability: 'Intelligentie', abbr: 'INT' },
  { name: 'Geschiedenis',      ability: 'Intelligentie', abbr: 'INT' },
  { name: 'Onderzoek',         ability: 'Intelligentie', abbr: 'INT' },
  { name: 'Natuur',            ability: 'Intelligentie', abbr: 'INT' },
  { name: 'Religie',           ability: 'Intelligentie', abbr: 'INT' },
  { name: 'Dierenverzorging',  ability: 'Wijsheid',      abbr: 'WIS' },
  { name: 'Inzicht',           ability: 'Wijsheid',      abbr: 'WIS' },
  { name: 'Geneeskunde',       ability: 'Wijsheid',      abbr: 'WIS' },
  { name: 'Waarneming',        ability: 'Wijsheid',      abbr: 'WIS' },
  { name: 'Overleven',         ability: 'Wijsheid',      abbr: 'WIS' },
  { name: 'Bedrog',            ability: 'Charisma',      abbr: 'CHA' },
  { name: 'Intimidatie',       ability: 'Charisma',      abbr: 'CHA' },
  { name: 'Optreden',          ability: 'Charisma',      abbr: 'CHA' },
  { name: 'Overtuigen',        ability: 'Charisma',      abbr: 'CHA' },
]

const SAVING_THROWS: { label: string; abbr: string }[] = [
  { label: 'Sterkte',       abbr: 'STR' },
  { label: 'Behendigheid',  abbr: 'DEX' },
  { label: 'Constitutie',   abbr: 'CON' },
  { label: 'Intelligentie', abbr: 'INT' },
  { label: 'Wijsheid',      abbr: 'WIS' },
  { label: 'Charisma',      abbr: 'CHA' },
]

const LANGUAGES_PRESET = [
  'Gemeen', 'Elfisch', 'Dwergs', 'Halflings', 'Gnooms', 'Orks',
  'Draconisch', 'Diefspreuk', 'Abyssal', 'Infernaal', 'Celestisch',
  'Sylvaans', 'Primordiaal', 'Onderd',
]

const WEAPON_PROF_PRESETS = ['Eenvoudige wapens', 'Martiale wapens']
const ARMOR_PROF_PRESETS  = ['Lichte wapenrusting', 'Gemiddelde wapenrusting', 'Zware wapenrusting', 'Schilden']

const WEAPON_MASTERY_PRESETS = ['Splijten', 'Schrammen', 'Kerven', 'Duwen', 'Uitputten', 'Vertragen', 'Omverwerpen', 'Plagen']

const CLASS_RESOURCE_PRESETS = [
  'Ki-punten', 'Woede', 'Bardische Inspiratie', 'Superioriteitsdob belstenen',
  'Toverijpunten', 'Goddelijke gunst', 'Wilde gedaante', 'Sluipaanval',
]

const SPELL_LEVELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

const HIT_DIE_OPTIONS: HitDie[] = ['d6', 'd8', 'd10', 'd12']

const SPELLCASTING_ABILITY_OPTIONS: { value: SpellcastingAbility; label: string }[] = [
  { value: 'int', label: 'Intelligentie (INT)' },
  { value: 'wis', label: 'Wijsheid (WIS)' },
  { value: 'cha', label: 'Charisma (CHA)' },
]

const statusOptions: { value: CharacterStatus; label: string }[] = [
  { value: 'active',   label: 'Actief'         },
  { value: 'inactive', label: 'Inactief'        },
  { value: 'retired',  label: 'Teruggetrokken' },
  { value: 'archived', label: 'Gearchiveerd'   },
]

// ─── NumericField ─────────────────────────────────────────────────────────────
interface NumericFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

function NumericField({ id, label, value, onChange, min = 0, max }: NumericFieldProps) {
  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="pangu-input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(n)
        }}
      />
    </div>
  )
}

// ─── TagInput ─────────────────────────────────────────────────────────────────
interface TagInputProps {
  id: string
  label: string
  values: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  presets?: string[]
}

function TagInput({ id, label, values, onChange, placeholder, presets }: TagInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function addTag(raw: string) {
    const tag = raw.trim()
    if (!tag || values.includes(tag)) return
    onChange([...values, tag])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeTag(tag: string) {
    onChange(values.filter(v => v !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag((e.currentTarget as HTMLInputElement).value)
    } else if (e.key === 'Backspace' && (e.currentTarget as HTMLInputElement).value === '') {
      onChange(values.slice(0, -1))
    }
  }

  function togglePreset(preset: string) {
    if (values.includes(preset)) {
      removeTag(preset)
    } else {
      onChange([...values, preset])
    }
  }

  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      {/* Preset quick-add buttons */}
      {presets && presets.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {presets.map(preset => {
            const active = values.includes(preset)
            return (
              <button
                key={preset}
                type="button"
                onClick={() => togglePreset(preset)}
                style={{
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 999,
                  border: active ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--hairline)',
                  background: active ? 'rgba(139,92,246,0.12)' : 'var(--surface)',
                  color: active ? 'var(--violet)' : 'var(--ink-soft)',
                  cursor: 'pointer',
                  transition: 'background var(--t-fast), border-color var(--t-fast), color var(--t-fast)',
                }}
              >
                {active ? '✓ ' : ''}{preset}
              </button>
            )
          })}
        </div>
      )}
      {/* Tag chip container + inline input */}
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
          minHeight: 42,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid var(--hairline)',
          background: 'var(--surface)',
          cursor: 'text',
        }}
      >
        {values.map(tag => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              padding: '2px 8px',
              borderRadius: 999,
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid rgba(139,92,246,0.25)',
              color: 'var(--ink)',
            }}
          >
            {tag}
            <button
              type="button"
              aria-label={`${tag} verwijderen`}
              onClick={(e) => { e.stopPropagation(); removeTag(tag) }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 14, height: 14,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(139,92,246,0.2)',
                color: 'var(--violet)',
                cursor: 'pointer',
                fontSize: 9,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ✕
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={id}
          type="text"
          placeholder={values.length === 0 ? (placeholder ?? 'Typ en druk op Enter...') : ''}
          onKeyDown={handleKeyDown}
          onBlur={(e) => addTag(e.currentTarget.value)}
          style={{
            flex: 1,
            minWidth: 120,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />
      </div>
      <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
        Druk op Enter of komma om toe te voegen, Backspace om te verwijderen.
      </p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const classId = useId()
  const subclassId = useId()
  const raceId = useId()
  const subtitleId = useId()
  const campaignSelectId = useId()
  const alignmentId = useId()
  const languagesId = useId()
  const toolProfId = useId()
  const weaponProfId = useId()
  const armorProfId = useId()
  const personalityId = useId()
  const idealsId = useId()
  const bondsId = useId()
  const flawsId = useId()
  const featsId = useId()
  const weaponMasteriesId = useId()
  const ageId = useId()
  const heightId = useId()
  const weightId = useId()
  const appearanceId = useId()
  const specialSensesId = useId()
  const concentrationSpellId = useId()
  const portraitUrlId = useId()

  const locationState = location.state as { isNew?: boolean } | null
  const isNew = locationState?.isNew ?? false

  const { data: characterData, isLoading } = useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as unknown as Character
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: characterData, isNew })

  const handlePortraitPositionChange = useCallback((posString: string) => {
    set('portrait_position', posString)
  }, [set])

  const {
    containerRef: portraitContainerRef,
    posString: portraitPosString,
    isDragging: portraitIsDragging,
    resetPosition: resetPortraitPosition,
    handlers: portraitPosHandlers,
  } = useImagePositioning(characterData?.portrait_position, handlePortraitPositionChange)

  // Three-state skill toggle: none → proficient → expertise → none
  const cycleSkill = useCallback((skillName: string) => {
    const proficients: string[] = form.proficient_skills ?? []
    const experts: string[] = form.expertise_skills ?? []
    if (experts.includes(skillName)) {
      // expertise → none
      set('expertise_skills', experts.filter(s => s !== skillName))
      set('proficient_skills', proficients.filter(s => s !== skillName))
    } else if (proficients.includes(skillName)) {
      // proficient → expertise
      set('expertise_skills', [...experts, skillName])
    } else {
      // none → proficient
      set('proficient_skills', [...proficients, skillName])
    }
  }, [form.proficient_skills, form.expertise_skills, set])

  const toggleSavingThrow = useCallback((abilityLabel: string) => {
    const current: string[] = form.saving_throw_proficiencies ?? []
    const updated = current.includes(abilityLabel)
      ? current.filter(s => s !== abilityLabel)
      : [...current, abilityLabel]
    set('saving_throw_proficiencies', updated)
  }, [form.saving_throw_proficiencies, set])

  // Load user's campaigns for the campaign selector
  const { data: userCampaigns } = useQuery<Pick<Campaign, 'id' | 'name'>[]>({
    queryKey: [...queryKeys.campaigns.all, 'names'],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Pick<Campaign, 'id' | 'name'>[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })

  const saveCharacter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('characters')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          character_class: form.character_class ?? null,
          character_subclass: form.character_subclass ?? null,
          character_race: form.character_race ?? null,
          campaign_id: form.campaign_id ?? null,
          level: form.level,
          xp: form.xp,
          xp_next: form.xp_next,
          hp_current: form.hp_current,
          hp_max: form.hp_max,
          armor_class: form.armor_class,
          speed: form.speed,
          initiative: form.initiative,
          proficiency_bonus: form.proficiency_bonus,
          stat_str: form.stat_str,
          stat_dex: form.stat_dex,
          stat_con: form.stat_con,
          stat_int: form.stat_int,
          stat_wis: form.stat_wis,
          stat_cha: form.stat_cha,
          gold: form.gold,
          silver: form.silver,
          copper: form.copper,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          proficient_skills: form.proficient_skills ?? [],
          // D&D 5.5e fields — proficiencies & combat state
          saving_throw_proficiencies: form.saving_throw_proficiencies ?? [],
          expertise_skills:           form.expertise_skills ?? [],
          languages:                  form.languages ?? [],
          tool_proficiencies:         form.tool_proficiencies ?? [],
          weapon_proficiencies:       form.weapon_proficiencies ?? [],
          armor_proficiencies:        form.armor_proficiencies ?? [],
          inspiration:                form.inspiration ?? false,
          hit_die:                    form.hit_die ?? 'd8',
          hit_dice_current:           form.hit_dice_current ?? 1,
          death_save_successes:       form.death_save_successes ?? 0,
          death_save_failures:        form.death_save_failures ?? 0,
          exhaustion:                 form.exhaustion ?? 0,
          alignment:                  form.alignment ?? null,
          // D&D 5.5e fields — spellcasting
          temp_hp:                    form.temp_hp ?? 0,
          spellcasting_ability:       form.spellcasting_ability ?? null,
          spell_slots:                (form.spell_slots ?? {}) as Record<string, unknown>,
          concentrating:              form.concentrating ?? false,
          concentration_spell:        form.concentration_spell ?? null,
          // D&D 5.5e fields — feats & resources
          feats:                      form.feats ?? [],
          weapon_masteries:           form.weapon_masteries ?? [],
          active_conditions:          form.active_conditions ?? [],
          class_resources:            (form.class_resources ?? {}) as Record<string, unknown>,
          // D&D 5.5e fields — currency
          platinum:                   form.platinum ?? 0,
          electrum:                   form.electrum ?? 0,
          // D&D 5.5e fields — speeds & senses
          fly_speed:                  form.fly_speed ?? 0,
          swim_speed:                 form.swim_speed ?? 0,
          climb_speed:                form.climb_speed ?? 0,
          burrow_speed:               form.burrow_speed ?? 0,
          darkvision:                 form.darkvision ?? 0,
          special_senses:             form.special_senses ?? null,
          // D&D 5.5e fields — physical appearance
          age:                        form.age ?? null,
          height:                     form.height ?? null,
          weight:                     form.weight ?? null,
          appearance:                 form.appearance ?? null,
          // D&D 5.5e fields — roleplay traits
          personality_traits:         form.personality_traits ?? null,
          ideals:                     form.ideals ?? null,
          bonds:                      form.bonds ?? null,
          flaws:                      form.flaws ?? null,
          portrait_url:               form.portrait_url ?? null,
          portrait_position:          form.portrait_position ?? 'center',
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: ['characters', 'campaign'] })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteCharacter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('characters').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      navigate('/characters')
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      const { error } = await supabase.from('characters').delete().eq('id', id!)
      if (error) { toast.error('Verwijderen mislukt'); return }
      queryClient.removeQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      navigate('/characters')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      navigate(`/characters/${id}`)
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      resetPortraitPosition(characterData!.portrait_position)
      navigate(`/characters/${id}`)
    }
  }

  function handleSave() {
    toast.promise(saveCharacter.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Karakter opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteCharacter.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Karakter verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Karakter laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!characterData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </button>
      </div>
    )
  }

  const proficiency = form.proficiency_bonus ?? 2
  const isInspired = form.inspiration ?? false

  // Spell slots helpers
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

  // Class resources helpers
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

  // Spellcasting-derived stats (for display in edit page)
  const spellAbility = form.spellcasting_ability ?? null
  const spellAbilityMod = (() => {
    if (!spellAbility) return 0
    const score = spellAbility === 'int' ? (form.stat_int ?? 10)
                : spellAbility === 'wis' ? (form.stat_wis ?? 10)
                : (form.stat_cha ?? 10)
    return Math.floor((score - 10) / 2)
  })()
  const spellSaveDC     = spellAbility ? 8 + proficiency + spellAbilityMod : null
  const spellAttackBonus = spellAbility ? proficiency + spellAbilityMod : null

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Terug naar karakter"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0 0 20px',
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-soft)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          ← Terug
        </button>

        <header style={{ marginBottom: 28 }}>
          <h1 className="pangu-display-xl">{characterData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details en stats van je personage aan.
          </p>
        </header>

        {/* ── Basisinfo ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Basisinfo</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor="char-name">Naam</label>
              <input
                id="char-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van je personage"
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={subtitleId}>Subtitel</label>
              <input
                id={subtitleId}
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Bijnaam of tagline"
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'active'}
                onChange={(e) => set('status', e.target.value as CharacterStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="pangu-label" htmlFor={campaignSelectId}>Kroniek</label>
              <select
                id={campaignSelectId}
                className="pangu-select"
                value={form.campaign_id ?? ''}
                onChange={(e) => set('campaign_id', e.target.value || null)}
              >
                <option value="">Geen kroniek</option>
                {userCampaigns?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Portrait URL + draggable reposition preview */}
          <div style={{ marginTop: 16 }}>
            <label className="pangu-label" htmlFor={portraitUrlId}>Portret (URL)</label>
            <input
              id={portraitUrlId}
              className="pangu-input"
              type="url"
              value={form.portrait_url ?? ''}
              onChange={(e) => set('portrait_url', e.target.value || null)}
              placeholder="https://..."
            />
            {sanitizeImageUrl(form.portrait_url) && (
              <div style={{ marginTop: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, userSelect: 'none' }}>
                  Sleep om uitsnede aan te passen
                </p>
                <div
                  ref={portraitContainerRef}
                  role="img"
                  aria-label={`Portretuitsnede: positie ${portraitPosString}. Gebruik pijltjestoetsen om bij te stellen.`}
                  tabIndex={0}
                  onMouseDown={portraitPosHandlers.onMouseDown}
                  onTouchStart={portraitPosHandlers.onTouchStart}
                  onKeyDown={portraitPosHandlers.onKeyDown}
                  style={{
                    position: 'relative',
                    cursor: portraitIsDragging ? 'grabbing' : 'grab',
                    borderRadius: 8,
                    overflow: 'hidden',
                    width: 160,
                    height: 220,
                    border: '1px solid var(--hairline)',
                    userSelect: 'none',
                    touchAction: 'none',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--violet)' }}
                  onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
                >
                  <img
                    src={sanitizeImageUrl(form.portrait_url)!}
                    alt=""
                    draggable={false}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      objectPosition: portraitPosString,
                      pointerEvents: 'none',
                      display: 'block',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Karakter ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Karakter</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor={classId}>Klasse</label>
              <input
                id={classId}
                className="pangu-input"
                value={form.character_class ?? ''}
                onChange={(e) => set('character_class', e.target.value || null)}
                placeholder="Bijv. Barbaar, Magiër, Schurk..."
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={subclassId}>Subklasse</label>
              <input
                id={subclassId}
                className="pangu-input"
                value={form.character_subclass ?? ''}
                onChange={(e) => set('character_subclass', e.target.value || null)}
                placeholder="Bijv. Razernijpad, Waarzegger..."
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={raceId}>Ras / Soort</label>
              <input
                id={raceId}
                className="pangu-input"
                value={form.character_race ?? ''}
                onChange={(e) => set('character_race', e.target.value || null)}
                placeholder="Bijv. Mens, Elf, Dwerg..."
              />
            </div>
            <NumericField
              id="char-level"
              label="Level"
              value={form.level ?? 1}
              onChange={(v) => set('level', Math.min(20, Math.max(1, v)))}
              min={1}
              max={20}
            />
            <div>
              <label className="pangu-label" htmlFor="char-hit-die">Trefferdobbelsteen</label>
              <select
                id="char-hit-die"
                className="pangu-select"
                value={form.hit_die ?? 'd8'}
                onChange={(e) => set('hit_die', e.target.value as HitDie)}
              >
                {HIT_DIE_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="pangu-label" htmlFor={alignmentId}>Uitlijning</label>
              <input
                id={alignmentId}
                className="pangu-input"
                value={form.alignment ?? ''}
                onChange={(e) => set('alignment', e.target.value || null)}
                placeholder="Bijv. Wettig goed, Neutraal, Chaotisch kwaad..."
              />
            </div>
          </div>
        </div>

        {/* ── Ervaring ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Ervaring</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumericField
              id="char-xp"
              label="Huidige XP"
              value={form.xp ?? 0}
              onChange={(v) => set('xp', Math.max(0, v))}
            />
            <NumericField
              id="char-xp-next"
              label="Volgende level (XP)"
              value={form.xp_next ?? 300}
              onChange={(v) => set('xp_next', Math.max(1, v))}
              min={1}
            />
          </div>
        </div>

        {/* ── Gevechtsstats ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Gevechtsstats</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumericField
              id="char-hp-current"
              label="Huidige HP"
              value={form.hp_current ?? 10}
              onChange={(v) => set('hp_current', Math.max(0, v))}
            />
            <NumericField
              id="char-hp-max"
              label="Max HP"
              value={form.hp_max ?? 10}
              onChange={(v) => set('hp_max', Math.max(1, v))}
              min={1}
            />
            <NumericField
              id="char-ac"
              label="Wapenrusting (AC)"
              value={form.armor_class ?? 10}
              onChange={(v) => set('armor_class', Math.max(1, v))}
              min={1}
            />
            <NumericField
              id="char-speed"
              label="Snelheid (ft)"
              value={form.speed ?? 30}
              onChange={(v) => set('speed', Math.max(0, v))}
            />
            <NumericField
              id="char-initiative"
              label="Initiatief"
              value={form.initiative ?? 0}
              onChange={(v) => set('initiative', v)}
              min={-10}
              max={20}
            />
            <NumericField
              id="char-proficiency"
              label="Vaardigheidsbonus"
              value={form.proficiency_bonus ?? 2}
              onChange={(v) => set('proficiency_bonus', Math.max(0, v))}
            />
            <NumericField
              id="char-temp-hp"
              label="Tijdelijke HP"
              value={form.temp_hp ?? 0}
              onChange={(v) => set('temp_hp', Math.max(0, v))}
            />
          </div>
        </div>

        {/* ── Zintuigen & Alternatieve snelheden ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Zintuigen &amp; Alternatieve snelheden</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            Vlieg-, zwem- en klimsnelheid worden apart bijgehouden; 0 = niet van toepassing.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumericField id="char-darkvision"    label="Duisterzicht (ft)"  value={form.darkvision ?? 0}    onChange={(v) => set('darkvision',    Math.max(0, v))} />
            <NumericField id="char-fly-speed"     label="Vliegsnelheid (ft)" value={form.fly_speed ?? 0}     onChange={(v) => set('fly_speed',     Math.max(0, v))} />
            <NumericField id="char-swim-speed"    label="Zwemsnelheid (ft)"  value={form.swim_speed ?? 0}    onChange={(v) => set('swim_speed',    Math.max(0, v))} />
            <NumericField id="char-climb-speed"   label="Klimsnelheid (ft)"  value={form.climb_speed ?? 0}   onChange={(v) => set('climb_speed',   Math.max(0, v))} />
            <NumericField id="char-burrow-speed"  label="Graafsnelheid (ft)" value={form.burrow_speed ?? 0}  onChange={(v) => set('burrow_speed',  Math.max(0, v))} />
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="pangu-label" htmlFor={specialSensesId}>Speciale zintuigen</label>
            <input
              id={specialSensesId}
              className="pangu-input"
              value={form.special_senses ?? ''}
              onChange={(e) => set('special_senses', e.target.value || null)}
              placeholder="Bijv. Waarzicht 30 ft, Trillingszin 10 ft..."
            />
          </div>
        </div>

        {/* ── Gevechtstoestand ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevechtstoestand</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>
            Huidige toestand in het gevecht: inspiratie, uitputting, trefferdobbelstenen en stervensgooien.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Inspiratie toggle */}
            <div>
              <p className="pangu-label" style={{ marginBottom: 8 }}>Inspiratie</p>
              <button
                type="button"
                aria-pressed={isInspired}
                onClick={() => set('inspiration', !isInspired)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  textAlign: 'left',
                  background: isInspired ? 'rgba(234,179,8,0.1)' : 'var(--surface)',
                  border: isInspired ? '1px solid rgba(234,179,8,0.4)' : '1px solid var(--hairline)',
                  transition: 'background var(--t-fast), border-color var(--t-fast)',
                }}
              >
                <span aria-hidden="true" style={{ fontSize: 18 }}>
                  {isInspired ? '✦' : '✧'}
                </span>
                <span style={{
                  fontSize: 14,
                  fontWeight: isInspired ? 600 : 400,
                  color: isInspired ? 'var(--gold)' : 'var(--ink-soft)',
                }}>
                  {isInspired ? 'Geïnspireerd' : 'Geen inspiratie'}
                </span>
              </button>
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                Voordeel op één d20 Test
              </p>
            </div>

            {/* Uitputting */}
            <NumericField
              id="char-exhaustion"
              label="Uitputting (0–10)"
              value={form.exhaustion ?? 0}
              onChange={(v) => set('exhaustion', Math.min(10, Math.max(0, v)))}
              min={0}
              max={10}
            />

            {/* Huidige trefferdobbelstenen */}
            <NumericField
              id="char-hit-dice-current"
              label="Huidige trefferdobbelstenen"
              value={form.hit_dice_current ?? 1}
              onChange={(v) => set('hit_dice_current', Math.min(form.level ?? 1, Math.max(0, v)))}
              min={0}
              max={form.level ?? 1}
            />

            {/* Doodssprongen — successen */}
            <div>
              <p className="pangu-label" style={{ marginBottom: 8 }}>Stervensgooien — successen</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => {
                  const filled = (form.death_save_successes ?? 0) >= n
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Succes ${n}: ${filled ? 'geslaagd' : 'mislukt'}`}
                      onClick={() => set('death_save_successes', filled ? n - 1 : n)}
                      style={{
                        width: 32, height: 32,
                        borderRadius: 8,
                        border: filled ? '2px solid rgba(62,207,178,0.6)' : '2px solid var(--hairline-strong)',
                        background: filled ? 'rgba(62,207,178,0.15)' : 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: filled ? 'var(--teal)' : 'var(--muted)',
                        transition: 'all var(--t-fast)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {filled ? '✓' : '○'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Doodssprongen — mislukkingen */}
            <div>
              <p className="pangu-label" style={{ marginBottom: 8 }}>Stervensgooien — mislukkingen</p>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3].map(n => {
                  const filled = (form.death_save_failures ?? 0) >= n
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Mislukking ${n}: ${filled ? 'mislukt' : 'leeg'}`}
                      onClick={() => set('death_save_failures', filled ? n - 1 : n)}
                      style={{
                        width: 32, height: 32,
                        borderRadius: 8,
                        border: filled ? '2px solid rgba(220,38,38,0.5)' : '2px solid var(--hairline-strong)',
                        background: filled ? 'rgba(220,38,38,0.12)' : 'var(--surface)',
                        cursor: 'pointer',
                        fontSize: 14,
                        color: filled ? 'var(--crimson)' : 'var(--muted)',
                        transition: 'all var(--t-fast)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      {filled ? '✕' : '○'}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Eigenschappen ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Eigenschappen</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumericField id="char-str" label="Sterkte (STR)" value={form.stat_str ?? 10} onChange={(v) => set('stat_str', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-dex" label="Behendigheid (DEX)" value={form.stat_dex ?? 10} onChange={(v) => set('stat_dex', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-con" label="Constitutie (CON)" value={form.stat_con ?? 10} onChange={(v) => set('stat_con', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-int" label="Intelligentie (INT)" value={form.stat_int ?? 10} onChange={(v) => set('stat_int', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-wis" label="Wijsheid (WIS)" value={form.stat_wis ?? 10} onChange={(v) => set('stat_wis', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-cha" label="Charisma (CHA)" value={form.stat_cha ?? 10} onChange={(v) => set('stat_cha', Math.min(30, Math.max(1, v)))} min={1} max={30} />
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
                  background: !spellAbility ? 'rgba(139,92,246,0.15)' : 'var(--surface)',
                  border: !spellAbility ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--hairline)',
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
                    background: spellAbility === opt.value ? 'rgba(139,92,246,0.15)' : 'var(--surface)',
                    border: spellAbility === opt.value ? '1px solid rgba(139,92,246,0.4)' : '1px solid var(--hairline)',
                    color: spellAbility === opt.value ? 'var(--violet)' : 'var(--ink-soft)',
                    fontWeight: spellAbility === opt.value ? 600 : 400,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {spellAbility && (
              <div style={{ display: 'flex', gap: 24, marginTop: 12, padding: '10px 16px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
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
                  background: (form.concentrating ?? false) ? 'rgba(62,207,178,0.1)' : 'var(--surface)',
                  border: (form.concentrating ?? false) ? '1px solid rgba(62,207,178,0.4)' : '1px solid var(--hairline)',
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
                <div key={level} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 12px', borderRadius: 8, background: slot.max > 0 ? 'rgba(139,92,246,0.06)' : 'var(--surface)', border: slot.max > 0 ? '1px solid rgba(139,92,246,0.2)' : '1px solid var(--hairline)' }}>
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
                    border: active ? '1px solid rgba(62,207,178,0.4)' : '1px solid var(--hairline)',
                    background: active ? 'rgba(62,207,178,0.1)' : 'var(--surface)',
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
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost pangu-btn-sm"
              onClick={() => {
                const inp = document.getElementById('custom-resource-input') as HTMLInputElement
                if (inp) { addResource(inp.value); inp.value = '' }
              }}
            >
              Toevoegen
            </button>
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

        {/* ── Uiterlijk ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Uiterlijk</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="pangu-label" htmlFor={ageId}>Leeftijd</label>
              <input id={ageId} className="pangu-input" value={form.age ?? ''} onChange={(e) => set('age', e.target.value || null)} placeholder="Bijv. 25 jaar" />
            </div>
            <div>
              <label className="pangu-label" htmlFor={heightId}>Lengte</label>
              <input id={heightId} className="pangu-input" value={form.height ?? ''} onChange={(e) => set('height', e.target.value || null)} placeholder="Bijv. 1,75 m" />
            </div>
            <div>
              <label className="pangu-label" htmlFor={weightId}>Gewicht</label>
              <input id={weightId} className="pangu-input" value={form.weight ?? ''} onChange={(e) => set('weight', e.target.value || null)} placeholder="Bijv. 70 kg" />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="pangu-label" htmlFor={appearanceId}>Uiterlijksbeschrijving</label>
            <textarea
              id={appearanceId}
              className="pangu-textarea"
              value={form.appearance ?? ''}
              onChange={(e) => set('appearance', e.target.value || null)}
              placeholder="Haarkleur, oogkleur, huidkleur, opvallende kenmerken, tatoeages, littekens..."
              rows={3}
            />
          </div>
        </div>

        {/* ── Achtergrond & Persoonlijkheid ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Achtergrond</p>
          <div>
            <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
            <textarea
              id={descriptionId}
              className="pangu-textarea"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value || null)}
              placeholder="Achtergrondverhaal en uiterlijk van je personage..."
              rows={4}
            />
          </div>

          {/* Karaktereigenschappen (D&D 5.5e) */}
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 24, marginBottom: 12, letterSpacing: '0.02em' }}>
            Karaktereigenschappen
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor={personalityId}>Persoonlijkheidskenmerken</label>
              <textarea
                id={personalityId}
                className="pangu-textarea"
                value={form.personality_traits ?? ''}
                onChange={(e) => set('personality_traits', e.target.value || null)}
                placeholder="Hoe gedraag je je? Wat zijn je gewoonten en eigenaardigheden?"
                rows={3}
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={idealsId}>Idealen</label>
              <textarea
                id={idealsId}
                className="pangu-textarea"
                value={form.ideals ?? ''}
                onChange={(e) => set('ideals', e.target.value || null)}
                placeholder="Waar geloof je in? Welke principes sturen je?"
                rows={3}
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={bondsId}>Banden</label>
              <textarea
                id={bondsId}
                className="pangu-textarea"
                value={form.bonds ?? ''}
                onChange={(e) => set('bonds', e.target.value || null)}
                placeholder="Wat verbindt je aan de wereld? Mensen, plekken, doelen?"
                rows={3}
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={flawsId}>Gebreken</label>
              <textarea
                id={flawsId}
                className="pangu-textarea"
                value={form.flaws ?? ''}
                onChange={(e) => set('flaws', e.target.value || null)}
                placeholder="Welke zwakheden of fouten heb je?"
                rows={3}
              />
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label className="pangu-label" htmlFor={notesId}>Privénotities</label>
            <textarea
              id={notesId}
              className="pangu-textarea"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              placeholder="Persoonlijke aantekeningen, geheimen en doelen van je personage..."
              rows={8}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </button>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              onClick={handleSave}
              disabled={!dirty || saveCharacter.isPending}
            >
              {saveCharacter.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginBottom: 32, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Karakter verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het karakter permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder karakter
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Karakter verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{characterData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteCharacter.isPending}>
            {deleteCharacter.isPending ? 'Verwijderen...' : 'Verwijder karakter'}
          </button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Karakter weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Dit item is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}
