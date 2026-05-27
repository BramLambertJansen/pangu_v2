import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { characterStatusLabel, characterStatusColor, itemRarityLabel, itemRarityColor, itemTypeLabel } from '@/lib/statusMaps'
import { useCharacterItems } from '@/hooks/queries/useCharacterItems'
import {
  EQUIPMENT_SLOT_LABELS,
  EQUIPMENT_SLOT_ICONS,
  ALLOWED_SLOTS_BY_TYPE,
  isEquippable,
  calculateEffectiveStats,
  getEquippedItemsBySlot,
  formatItemBonuses,
} from '@/utils/equipmentUtils'
import type { Character } from '@/types/character.types'
import type { EquipmentSlot, Item } from '@/types/item.types'

type Tab = 'stats' | 'spreuken' | 'inventaris' | 'vaardigheden' | 'lore'

interface Skill {
  name: string
  ability: 'stat_str' | 'stat_dex' | 'stat_con' | 'stat_int' | 'stat_wis' | 'stat_cha'
  abbr: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
}

const SKILLS: Skill[] = [
  { name: 'Atletiek',          ability: 'stat_str', abbr: 'STR' },
  { name: 'Acrobatiek',        ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Vingervlugheid',    ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Sluipen',           ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Magie',             ability: 'stat_int', abbr: 'INT' },
  { name: 'Geschiedenis',      ability: 'stat_int', abbr: 'INT' },
  { name: 'Onderzoek',         ability: 'stat_int', abbr: 'INT' },
  { name: 'Natuur',            ability: 'stat_int', abbr: 'INT' },
  { name: 'Religie',           ability: 'stat_int', abbr: 'INT' },
  { name: 'Dierenverzorging',  ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Inzicht',           ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Geneeskunde',       ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Waarneming',        ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Overleven',         ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Bedrog',            ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Intimidatie',       ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Optreden',          ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Overtuigen',        ability: 'stat_cha', abbr: 'CHA' },
]

const abilityScores: { key: keyof Character; abbr: string; label: string }[] = [
  { key: 'stat_str', abbr: 'STR', label: 'Sterkte' },
  { key: 'stat_dex', abbr: 'DEX', label: 'Behendigheid' },
  { key: 'stat_con', abbr: 'CON', label: 'Constitutie' },
  { key: 'stat_int', abbr: 'INT', label: 'Intelligentie' },
  { key: 'stat_wis', abbr: 'WIS', label: 'Wijsheid' },
  { key: 'stat_cha', abbr: 'CHA', label: 'Charisma' },
]

// Ordered slot layout for the equipment grid (3 columns × 4 rows, 10 slots + 2 empty).
const SLOT_GRID: (EquipmentSlot | null)[] = [
  'head',      'neck',     'chest',
  'cloak',     'gloves',   'boots',
  'ring1',     'ring2',    null,
  'main_hand', 'off_hand', null,
]

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2)
  return mod >= 0 ? `+${mod}` : `${mod}`
}

function formatXP(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('nl-NL')
}

const headerGradients = [
  'radial-gradient(ellipse 60% 80% at 25% 35%, rgba(56,152,255,0.32) 0%, rgba(30,80,200,0.18) 45%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 28% 38%, rgba(107,167,255,0.28) 0%, rgba(56,152,255,0.18) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 30% 40%, rgba(155,138,255,0.24) 0%, rgba(56,152,255,0.20) 50%, var(--void) 78%)',
  'radial-gradient(ellipse 60% 80% at 25% 38%, rgba(56,152,255,0.26) 0%, rgba(62,207,178,0.16) 50%, var(--void) 78%)',
]

function starfieldDots(id: string) {
  const dots = []
  for (let i = 0; i < 10; i++) {
    const seed = (id.charCodeAt(i % id.length) || 37) * (i + 1)
    const x = ((seed * 13) % 90) + 5
    const y = ((seed * 7) % 80) + 5
    const size = ((seed % 3) + 1) * 1.5
    const opacity = ((seed % 5) + 3) * 0.07
    dots.push({ x, y, size, opacity })
  }
  return dots
}

function DiceRoller() {
  const [selectedDie, setSelectedDie] = useState<number>(20)
  const [result, setResult] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const dice = [4, 6, 8, 10, 12, 20, 100]

  function roll(sides: number) {
    const r = Math.floor(Math.random() * sides) + 1
    setSelectedDie(sides)
    setResult(r)
  }

  if (!visible) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="pangu-btn pangu-btn-ghost pangu-btn-sm" onClick={() => setVisible(true)}>
          ⬡ Dobbelstenen
        </button>
      </div>
    )
  }

  return (
    <div className="pangu-surface" style={{ padding: 20, minWidth: 200, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Dice
        </span>
        <button
          type="button"
          aria-label="Dobbelstenen verbergen"
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, lineHeight: 1, padding: '2px 4px', transition: 'color var(--t-fast)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        aria-label={`Gooi d${selectedDie}`}
        onClick={() => roll(selectedDie)}
        style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--hairline)', borderRadius: 10, padding: '16px 12px', marginBottom: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'border-color var(--t-fast)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--violet)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '' }}
      >
        <svg aria-hidden="true" width="36" height="36" viewBox="0 0 48 48" style={{ opacity: 0.6 }}>
          <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="var(--violet)" strokeWidth="2" />
          {result !== null && <line x1="16" y1="24" x2="32" y2="24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />}
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: result !== null ? 28 : 14, fontWeight: 700, color: result !== null ? 'var(--ink)' : 'var(--muted)', lineHeight: 1 }}>
          {result !== null ? result : `D${selectedDie}`}
        </span>
        {result === null && <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-body)' }}>Klik om te gooien</span>}
        {result !== null && <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>D{selectedDie}</span>}
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {dice.map((d) => (
          <button
            key={d}
            type="button"
            aria-label={`Selecteer d${d}`}
            aria-pressed={selectedDie === d}
            onClick={() => roll(d)}
            style={{ padding: '8px 4px', borderRadius: 8, border: '1px solid', borderColor: selectedDie === d ? 'var(--violet)' : 'var(--hairline)', background: selectedDie === d ? 'rgba(139,92,246,0.15)' : 'var(--surface)', color: selectedDie === d ? 'var(--violet)' : 'var(--ink-soft)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)', cursor: 'pointer', transition: 'all var(--t-fast)', letterSpacing: '0.04em' }}
            onMouseEnter={(e) => { if (selectedDie !== d) (e.currentTarget as HTMLElement).style.borderColor = 'var(--hairline-strong)' }}
            onMouseLeave={(e) => { if (selectedDie !== d) (e.currentTarget as HTMLElement).style.borderColor = 'var(--hairline)' }}
          >
            d{d}
          </button>
        ))}
      </div>
    </div>
  )
}

// Popover to pick which slot to equip an item into.
function EquipSlotPicker({
  item,
  onEquip,
  onClose,
}: {
  item: Item
  onEquip: (slot: EquipmentSlot) => void
  onClose: () => void
}) {
  const allowedSlots = ALLOWED_SLOTS_BY_TYPE[item.item_type]
  return (
    <div
      style={{
        position: 'absolute', zIndex: 50, right: 0, top: '100%',
        marginTop: 4, minWidth: 180,
        background: 'var(--surface-2)', border: '1px solid var(--hairline-strong)',
        borderRadius: 10, padding: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 4px 6px' }}>
        Equippen in slot
      </p>
      {allowedSlots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => { onEquip(slot); onClose() }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, color: 'var(--ink-soft)', transition: 'background var(--t-fast)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface-3)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
        >
          <span aria-hidden="true">{EQUIPMENT_SLOT_ICONS[slot]}</span>
          {EQUIPMENT_SLOT_LABELS[slot]}
        </button>
      ))}
    </div>
  )
}

export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [equipPickerItemId, setEquipPickerItemId] = useState<string | null>(null)

  const { data: items, isLoading: isLoadingItems, equipItem, unequipItem } = useCharacterItems(id)

  const returnItemToDm = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('items')
        .update({ character_id: null, equipped_slot: null, updated_at: new Date().toISOString() })
        .eq('id', itemId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.items(id!) })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      toast.success('Item teruggegeven aan de DM')
    },
    onError: () => {
      toast.error('Teruggeven mislukt')
    },
  })

  const { data: character, isLoading } = useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Character
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const updateHp = useMutation({
    mutationFn: async (newHp: number) => {
      const { error } = await supabase
        .from('characters')
        .update({ hp_current: newHp, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => {
      toast.error('HP bijwerken mislukt')
    },
  })

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Karakter laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!character) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </button>
      </div>
    )
  }

  const code = (id!.charCodeAt(0) || 0) + (id!.charCodeAt(id!.length - 1) || 0)
  const headerGradient = headerGradients[code % headerGradients.length]
  const dots = starfieldDots(id!)

  const eyebrowParts = [character.character_race, character.character_class, character.character_subclass].filter(Boolean)
  const xp = character.xp ?? 0
  const xpNext = character.xp_next ?? 0
  const hpCurrent = character.hp_current ?? 0
  const hpMax = character.hp_max ?? 0
  const xpPct = xpNext > 0 ? Math.min(100, Math.round((xp / xpNext) * 100)) : 0
  const hpPct = hpMax > 0 ? Math.min(100, Math.round((hpCurrent / hpMax) * 100)) : 0
  const hpLow = hpCurrent < hpMax * 0.3
  const dexMod = Math.floor(((character.stat_dex ?? 10) - 10) / 2)
  const dexLabel = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`

  // Compute equipment-based effective stats
  const equippedItems = (items ?? []).filter((i) => i.equipped_slot !== null)
  const effectiveStats = calculateEffectiveStats(character, equippedItems)
  const equippedBySlot = getEquippedItemsBySlot(items ?? [])

  const acBonus = effectiveStats.ac - (character.armor_class ?? 0)

  return (
    <div>
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', border: '1px solid var(--hairline)', overflow: 'hidden', height: 200, background: `${headerGradient}, var(--void)` }}>
          {dots.map((dot, i) => (
            <div key={i} aria-hidden="true" style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: '50%', background: 'var(--ink)', opacity: dot.opacity, pointerEvents: 'none' }} />
          ))}
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', fontFamily: 'var(--font-display)', fontSize: 'clamp(100px, 18vw, 160px)', fontWeight: 700, color: 'rgba(107,167,255,0.07)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ position: 'absolute', top: 16, right: 16 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: characterStatusColor[character.status], border: `1px solid ${characterStatusColor[character.status]}55`, background: `${characterStatusColor[character.status]}11` }}>
              {characterStatusLabel[character.status]}
            </span>
          </div>
        </div>

        <div style={{ padding: '20px 4px 0' }}>
          {eyebrowParts.length > 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--teal)', margin: '0 0 6px' }}>
              {eyebrowParts.join(' · ')}
            </p>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px, 8vw, 56px)', fontWeight: 600, lineHeight: 0.92, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', margin: '0 0 16px' }}>
            {character.name}
          </h1>

          <div className="pangu-surface" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>Level</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 42, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{character.level}</span>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>Experience</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>{formatXP(xp)} / {formatXP(xpNext)} XP</span>
              </div>
              <div role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={xpNext} aria-label={`${xp} van ${xpNext} ervaringspunten`} style={{ height: 6, borderRadius: 3, background: 'var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--violet)', borderRadius: 3, transition: 'width 0.4s var(--ease-out)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" aria-label="Karakter tabs" className="pangu-tab-bar--line" style={{ marginBottom: 20 }}>
        {(
          [
            { key: 'stats',        label: 'Stats' },
            { key: 'spreuken',     label: 'Spreuken' },
            { key: 'inventaris',   label: `Inventaris${items && items.length > 0 ? ` (${items.length})` : ''}` },
            { key: 'vaardigheden', label: 'Vaardigheden' },
            { key: 'lore',         label: 'Lore' },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button key={key} type="button" role="tab" aria-selected={activeTab === key} aria-controls={`tabpanel-${key}`} id={`tab-${key}`} onClick={() => setActiveTab(key)} className="pangu-tab--line">
            {label}
          </button>
        ))}
      </div>

      {/* ── Stats tab ── */}
      <div id="tabpanel-stats" role="tabpanel" aria-labelledby="tab-stats" hidden={activeTab !== 'stats'}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16 }}>

          {/* HP card */}
          <div className="pangu-surface" style={{ padding: '18px 20px', minHeight: 110, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: hpLow ? 'var(--crimson)' : 'var(--muted)', margin: 0 }}>HP</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" aria-label="HP verlagen" onClick={() => updateHp.mutate(Math.max(0, hpCurrent - 1))} disabled={updateHp.isPending || hpCurrent <= 0} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1, opacity: hpCurrent <= 0 ? 0.4 : 1, flexShrink: 0 }}>−</button>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: hpLow ? 'var(--crimson)' : 'var(--ink)', margin: 0, lineHeight: 1 }}>
                <span>{hpCurrent}</span>
                <span style={{ fontSize: 18, color: 'var(--muted)', fontWeight: 400 }}>/{hpMax}</span>
              </p>
              <button type="button" aria-label="HP verhogen" onClick={() => updateHp.mutate(Math.min(hpMax, hpCurrent + 1))} disabled={updateHp.isPending || hpCurrent >= hpMax} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent >= hpMax ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, lineHeight: 1, opacity: hpCurrent >= hpMax ? 0.4 : 1, flexShrink: 0 }}>+</button>
            </div>
            <div role="progressbar" aria-valuenow={hpCurrent} aria-valuemin={0} aria-valuemax={hpMax} aria-label={`${hpCurrent} van ${hpMax} levenspunten`} style={{ height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden', marginTop: 'auto' }}>
              <div style={{ height: '100%', width: `${hpPct}%`, background: hpLow ? 'var(--crimson)' : 'var(--teal)', borderRadius: 2, transition: 'width 0.3s var(--ease-out)' }} />
            </div>
          </div>

          {/* AC card — shows effective AC with equipment bonus */}
          <div className="pangu-surface" style={{ padding: '18px 20px', minHeight: 110, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>
              Armor Class
              {acBonus > 0 && (
                <span style={{ marginLeft: 6, color: 'var(--teal)', fontWeight: 700 }}>+{acBonus} uitrusting</span>
              )}
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
              {effectiveStats.ac}
              {acBonus > 0 && (
                <span style={{ fontSize: 16, color: 'var(--muted)', fontWeight: 400, marginLeft: 8 }}>
                  ({character.armor_class} + {acBonus})
                </span>
              )}
            </p>
            {character.subtitle && <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: 'auto 0 0', fontStyle: 'italic' }}>{character.subtitle}</p>}
          </div>

          {/* Initiative card */}
          <div className="pangu-surface" style={{ padding: '18px 20px', minHeight: 110, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Initiative</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
              {effectiveStats.initiative >= 0 ? `+${effectiveStats.initiative}` : `${effectiveStats.initiative}`}
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 'auto 0 0', fontFamily: 'var(--font-body)' }}>
              DEX modifier ({dexLabel})
            </p>
          </div>

          {/* Speed card */}
          <div className="pangu-surface" style={{ padding: '18px 20px', minHeight: 110, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Speed</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
              {effectiveStats.speed}
              <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--muted)', marginLeft: 4 }}>ft</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: 'auto 0 0', fontFamily: 'var(--font-body)' }}>
              Proficiency +{character.proficiency_bonus}
            </p>
          </div>
        </div>

        {/* Ability scores with equipment bonuses */}
        <div className="pangu-surface" style={{ padding: 24, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Eigenschappen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {abilityScores.map(({ key, abbr, label }) => {
              const baseScore = character[key] as number
              const effectiveKey = key.replace('stat_', '') as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
              const effectiveScore = effectiveStats[effectiveKey]
              const bonus = effectiveScore - baseScore
              const mod = abilityModifier(effectiveScore)
              return (
                <div
                  key={key}
                  title={label}
                  style={{
                    background: 'var(--surface)', border: `1px solid ${bonus !== 0 ? 'rgba(62,207,178,0.35)' : 'var(--hairline)'}`,
                    borderRadius: 10, padding: '14px 8px 12px',
                    textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>{abbr}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{mod}</p>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>{effectiveScore}</span>
                  </div>
                  {bonus !== 0 && (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                      {bonus > 0 ? `+${bonus}` : bonus} uitrusting
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Traits */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
              Traits
              <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          </div>
          {character.description ? (
            <div className="pangu-surface" style={{ padding: '18px 20px' }}>
              <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
            </div>
          ) : (
            <div className="pangu-surface" style={{ padding: '18px 20px' }}>
              <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Kenmerken worden hier weergegeven wanneer ze zijn toegevoegd.</p>
            </div>
          )}
        </div>

        {/* Currency */}
        {(character.gold > 0 || character.silver > 0 || character.copper > 0) && (
          <div className="pangu-surface" style={{ padding: 24 }}>
            <p className="pangu-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Goud',  value: character.gold,   color: 'var(--gold)' },
                { label: 'Zilver', value: character.silver, color: 'var(--ink-soft)' },
                { label: 'Koper', value: character.copper,  color: '#b87333' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 64 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0, fontFamily: 'var(--font-display)' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Spreuken tab ── */}
      <div id="tabpanel-spreuken" role="tabpanel" aria-labelledby="tab-spreuken" hidden={activeTab !== 'spreuken'}>
        <div className="pangu-surface" style={{ padding: '48px 28px', textAlign: 'center' }}>
          <div style={{ marginBottom: 16 }}>
            <svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--violet)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
              <path d="M12 2 L13.5 10.5 L22 12 L13.5 13.5 L12 22 L10.5 13.5 L2 12 L10.5 10.5 Z" fill="var(--violet)" stroke="none" opacity="0.3" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 8px' }}>Spreuken</p>
          <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Spreuken zijn beschikbaar in een volgende update.</p>
        </div>
      </div>

      {/* ── Inventaris tab ── */}
      <div id="tabpanel-inventaris" role="tabpanel" aria-labelledby="tab-inventaris" hidden={activeTab !== 'inventaris'}>
        {isLoadingItems ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
            <Spinner size="md" />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>

              {/* ── Uitrusting grid ── */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
                  Uitrusting
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {SLOT_GRID.map((slot, idx) => {
                    if (!slot) return <div key={`empty-${idx}`} />
                    const equippedItem = equippedBySlot[slot]
                    return (
                      <div
                        key={slot}
                        style={{
                          background: equippedItem ? 'rgba(212,175,55,0.06)' : 'var(--surface)',
                          border: equippedItem ? '1px solid rgba(212,175,55,0.35)' : '1px solid var(--hairline)',
                          borderRadius: 10,
                          padding: '10px 10px 8px',
                          display: 'flex', flexDirection: 'column', gap: 4,
                          minHeight: 72,
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span aria-hidden="true" style={{ fontSize: 14 }}>{EQUIPMENT_SLOT_ICONS[slot]}</span>
                          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                            {EQUIPMENT_SLOT_LABELS[slot]}
                          </span>
                        </div>
                        {equippedItem ? (
                          <>
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, wordBreak: 'break-word' }}>
                              {equippedItem.is_magical && <span style={{ color: 'var(--gold)' }} aria-hidden="true">✦ </span>}
                              {equippedItem.name}
                            </span>
                            {formatItemBonuses(equippedItem.properties).length > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--teal)', lineHeight: 1.3 }}>
                                {formatItemBonuses(equippedItem.properties).join(' · ')}
                              </span>
                            )}
                            <button
                              type="button"
                              aria-label={`${equippedItem.name} uitrusten`}
                              onClick={() => {
                                unequipItem.mutate(equippedItem.id)
                                toast.success(`${equippedItem.name} uitgerust`)
                              }}
                              style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 11, lineHeight: 1, padding: 2, transition: 'color var(--t-fast)' }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--crimson)' }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--subtle)', fontStyle: 'italic' }}>Leeg</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Inventaris lijst ── */}
              <div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: 10 }}>
                  Inventaris
                </span>

                {items && items.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {items.map((item, idx) => {
                      const equippable = isEquippable(item.item_type)
                      const isEquipped = !!item.equipped_slot
                      const bonuses = formatItemBonuses(item.properties)
                      const showPicker = equipPickerItemId === item.id

                      return (
                        <div
                          key={item.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '14px 0',
                            borderBottom: idx < items.length - 1 ? '1px solid var(--hairline)' : 'none',
                          }}
                        >
                          {/* Item icon */}
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: isEquipped ? 'rgba(212,175,55,0.1)' : 'var(--surface)', border: isEquipped ? '1px solid rgba(212,175,55,0.3)' : '1px solid var(--hairline)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isEquipped ? 'var(--gold)' : 'var(--muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                            </svg>
                          </div>

                          {/* Item info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, letterSpacing: '0.03em', color: 'var(--ink)' }}>
                                {item.is_magical && <span style={{ color: 'var(--gold)', marginRight: 4 }} aria-hidden="true">✦</span>}
                                {item.name}
                              </span>
                              {item.rarity !== 'common' && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: itemRarityColor[item.rarity], border: `1px solid ${itemRarityColor[item.rarity]}55`, background: `${itemRarityColor[item.rarity]}11` }}>
                                  {itemRarityLabel[item.rarity]}
                                </span>
                              )}
                              {isEquipped && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid rgba(212,175,55,0.35)', background: 'rgba(212,175,55,0.08)' }}>
                                  {EQUIPMENT_SLOT_LABELS[item.equipped_slot!]}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '2px 0 0' }}>
                              {itemTypeLabel[item.item_type]}
                              {bonuses.length > 0 && (
                                <span style={{ color: 'var(--teal)', textTransform: 'none', letterSpacing: 0 }}>
                                  {' · '}{bonuses.join(' · ')}
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, position: 'relative' }}>
                            {item.quantity > 1 && (
                              <span style={{ fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600 }}>×{item.quantity}</span>
                            )}

                            {/* Equip / Unequip */}
                            {equippable && !isEquipped && (
                              <>
                                <button
                                  type="button"
                                  className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                                  onClick={() => setEquipPickerItemId(showPicker ? null : item.id)}
                                  aria-label={`${item.name} equippen`}
                                  style={{ fontSize: 12 }}
                                >
                                  Equippen ▾
                                </button>
                                {showPicker && (
                                  <EquipSlotPicker
                                    item={item}
                                    onEquip={(slot) => {
                                      equipItem.mutate({ itemId: item.id, slot })
                                      toast.success(`${item.name} uitgerust in ${EQUIPMENT_SLOT_LABELS[slot]}`)
                                    }}
                                    onClose={() => setEquipPickerItemId(null)}
                                  />
                                )}
                              </>
                            )}
                            {isEquipped && (
                              <button
                                type="button"
                                className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                                onClick={() => {
                                  unequipItem.mutate(item.id)
                                  toast.success(`${item.name} uitgerust`)
                                }}
                                aria-label={`${item.name} uitrusten`}
                                style={{ fontSize: 12 }}
                              >
                                Uitrusten
                              </button>
                            )}

                            {/* Return to DM */}
                            <button
                              type="button"
                              className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                              onClick={() => returnItemToDm.mutate(item.id)}
                              disabled={returnItemToDm.isPending}
                              aria-label={`${item.name} teruggeven aan DM`}
                            >
                              ↩
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="pangu-surface" style={{ padding: 28, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen items in je inventaris.</p>
                    <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '8px 0 0' }}>De DM kan items toewijzen vanuit de kroniek-schatkist.</p>
                  </div>
                )}

                {/* Treasury */}
                {(character.gold > 0 || character.silver > 0 || character.copper > 0) && (
                  <div className="pangu-surface" style={{ padding: '16px 20px', marginTop: 16 }}>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>Treasury</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[
                        { label: 'Gold',   value: character.gold,   color: 'var(--gold)',     suffix: 'gp' },
                        { label: 'Silver', value: character.silver, color: 'var(--ink-soft)', suffix: 'sp' },
                        { label: 'Copper', value: character.copper, color: '#b87333',         suffix: 'cp' },
                      ].map(({ label, value, color, suffix }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 12, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-body)' }}>{value} <span style={{ fontSize: 11, opacity: 0.7 }}>{suffix}</span></span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dice roller */}
            <DiceRoller />
          </div>
        )}
      </div>

      {/* ── Vaardigheden tab ── */}
      <div id="tabpanel-vaardigheden" role="tabpanel" aria-labelledby="tab-vaardigheden" hidden={activeTab !== 'vaardigheden'}>
        {effectiveStats.stealthDisadvantage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', marginBottom: 16 }}>
            <span aria-hidden="true" style={{ fontSize: 16 }}>⚠️</span>
            <p style={{ fontSize: 13, color: 'var(--crimson)', margin: 0, fontWeight: 500 }}>
              Nadeel op Sluipen door uitgerust zwaar pantser.
            </p>
          </div>
        )}
        <div className="pangu-surface" style={{ padding: 24 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
            Gemarkeerde vaardigheden tellen je vaardigheidsbonus (+{character.proficiency_bonus ?? 0}) mee.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {SKILLS.map((skill) => {
              const isProficient = (character.proficient_skills ?? []).includes(skill.name)
              const baseScore = (character[skill.ability] as number | null) ?? 10
              const baseMod = Math.floor((baseScore - 10) / 2)
              const profBonus = isProficient ? (character.proficiency_bonus ?? 0) : 0
              const itemBonus = effectiveStats.skillBonuses[skill.name] ?? 0
              const totalMod = baseMod + profBonus + itemBonus
              const modLabel = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`
              const hasItemBonus = itemBonus !== 0

              return (
                <div
                  key={skill.name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                    border: isProficient ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--hairline)',
                    transition: 'background var(--t-fast), border-color var(--t-fast)',
                  }}
                >
                  <span
                    aria-label={isProficient ? `${skill.name}: vaardig` : `${skill.name}: niet vaardig`}
                    style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isProficient ? 'var(--violet)' : 'transparent', border: `2px solid ${isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`, transition: 'background var(--t-fast), border-color var(--t-fast)' }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: isProficient ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: isProficient ? 600 : 400 }}>
                    {skill.name}
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5, fontWeight: 400 }}>{skill.abbr}</span>
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {hasItemBonus && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)' }}>
                        {itemBonus > 0 ? `+${itemBonus}` : itemBonus}
                      </span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: isProficient ? 'var(--violet)' : 'var(--ink-soft)', minWidth: 28, textAlign: 'right' }}>
                      {modLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Lore tab ── */}
      <div id="tabpanel-lore" role="tabpanel" aria-labelledby="tab-lore" hidden={activeTab !== 'lore'}>
        {character.description ? (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
          </div>
        ) : (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Nog geen achtergrondverhaal toegevoegd.</p>
          </div>
        )}
        <div className="pangu-surface" style={{ padding: 28, borderColor: 'rgba(107,167,255,0.18)', background: 'rgba(107,167,255,0.03)' }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>✦ Privénotities</p>
          <p style={{ fontSize: 12, color: 'var(--azure)', marginBottom: 16, marginTop: 0 }}>Alleen zichtbaar voor jou</p>
          {character.notes ? (
            <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.notes}</p>
          ) : (
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen notities.</p>
          )}
        </div>
      </div>
    </div>
  )
}
