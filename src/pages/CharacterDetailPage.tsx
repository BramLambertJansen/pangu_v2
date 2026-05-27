import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Spinner } from '@/components/ui/Spinner'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import {
  characterStatusLabel, characterStatusColor,
  itemRarityLabel, itemRarityColor, itemTypeLabel,
} from '@/lib/statusMaps'
import { useCharacterItems } from '@/hooks/queries/useCharacterItems'
import {
  EQUIPMENT_SLOT_LABELS,
  EQUIPMENT_SLOT_ICONS,
  ALLOWED_SLOTS_BY_TYPE,
  isEquippable,
  calculateEffectiveStats,
  formatItemBonuses,
} from '@/utils/equipmentUtils'
import type { Character, SpellSlots, ClassResources } from '@/types/character.types'
import type { EquipmentSlot, Item } from '@/types/item.types'

type Tab = 'stats' | 'spreuken' | 'inventaris' | 'vaardigheden' | 'lore'

interface Skill {
  name: string
  ability: 'stat_str' | 'stat_dex' | 'stat_con' | 'stat_int' | 'stat_wis' | 'stat_cha'
  abbr: 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA'
}

const SAVING_THROWS: { label: string; abbr: string; statKey: 'stat_str' | 'stat_dex' | 'stat_con' | 'stat_int' | 'stat_wis' | 'stat_cha' }[] = [
  { label: 'Sterkte',       abbr: 'STR', statKey: 'stat_str' },
  { label: 'Behendigheid',  abbr: 'DEX', statKey: 'stat_dex' },
  { label: 'Constitutie',   abbr: 'CON', statKey: 'stat_con' },
  { label: 'Intelligentie', abbr: 'INT', statKey: 'stat_int' },
  { label: 'Wijsheid',      abbr: 'WIS', statKey: 'stat_wis' },
  { label: 'Charisma',      abbr: 'CHA', statKey: 'stat_cha' },
]

// D&D 5.5e conditions (including 3 new: Daas, Zwijgen, Vertraagd)
const CONDITIONS = [
  'Verblind', 'Betoverd', 'Daas', 'Doof', 'Gevallen', 'Beangstigd',
  'Gegrepen', 'Buiten gevecht', 'Onzichtbaar', 'Verlamd', 'Versteend',
  'Vergiftigd', 'Beperkt', 'Zwijgen', 'Vertraagd', 'Bedwelmd', 'Bewusteloos',
]

const SPELLCASTING_ABILITY_LABELS: Record<string, string> = {
  int: 'Intelligentie',
  wis: 'Wijsheid',
  cha: 'Charisma',
}

const SPELL_LEVEL_LABELS = ['1e', '2e', '3e', '4e', '5e', '6e', '7e', '8e', '9e']

const SKILLS: Skill[] = [
  { name: 'Atletiek',         ability: 'stat_str', abbr: 'STR' },
  { name: 'Acrobatiek',       ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Vingervlugheid',   ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Sluipen',          ability: 'stat_dex', abbr: 'DEX' },
  { name: 'Magie',            ability: 'stat_int', abbr: 'INT' },
  { name: 'Geschiedenis',     ability: 'stat_int', abbr: 'INT' },
  { name: 'Onderzoek',        ability: 'stat_int', abbr: 'INT' },
  { name: 'Natuur',           ability: 'stat_int', abbr: 'INT' },
  { name: 'Religie',          ability: 'stat_int', abbr: 'INT' },
  { name: 'Dierenverzorging', ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Inzicht',          ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Geneeskunde',      ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Waarneming',       ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Overleven',        ability: 'stat_wis', abbr: 'WIS' },
  { name: 'Bedrog',           ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Intimidatie',      ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Optreden',         ability: 'stat_cha', abbr: 'CHA' },
  { name: 'Overtuigen',       ability: 'stat_cha', abbr: 'CHA' },
]

const abilityScores: { key: keyof Character; abbr: string; label: string }[] = [
  { key: 'stat_str', abbr: 'STR', label: 'Strength'     },
  { key: 'stat_dex', abbr: 'DEX', label: 'Dexterity'    },
  { key: 'stat_con', abbr: 'CON', label: 'Constitution' },
  { key: 'stat_int', abbr: 'INT', label: 'Intelligence' },
  { key: 'stat_wis', abbr: 'WIS', label: 'Wisdom'       },
  { key: 'stat_cha', abbr: 'CHA', label: 'Charisma'     },
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
    dots.push({
      x: ((seed * 13) % 90) + 5,
      y: ((seed * 7)  % 80) + 5,
      size: ((seed % 3) + 1) * 1.5,
      opacity: ((seed % 5) + 3) * 0.07,
    })
  }
  return dots
}

// ─── Slot picker dropdown ──────────────────────────────────────────────────────
function SlotPicker({
  item,
  onEquip,
  onClose,
}: {
  item: Item
  onEquip: (slot: EquipmentSlot) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Kies een uitrustingslot"
      style={{
        position: 'absolute', zIndex: 50, right: 0, top: '100%',
        marginTop: 4, minWidth: 172,
        background: 'var(--void-2)',
        border: '1px solid var(--hairline-strong)',
        borderRadius: 10, padding: '6px 4px',
        boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
      }}
    >
      <p style={{
        fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: 'var(--muted)',
        margin: '0 8px 6px',
      }}>
        Uitrusten in slot
      </p>
      {ALLOWED_SLOTS_BY_TYPE[item.item_type].map((slot) => (
        <button
          key={slot}
          type="button"
          role="option"
          onClick={() => { onEquip(slot); onClose() }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '7px 10px',
            borderRadius: 7, border: 'none',
            background: 'transparent', cursor: 'pointer',
            fontSize: 13, color: 'var(--ink-soft)',
            transition: 'background var(--t-fast), color var(--t-fast)',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(139,92,246,0.12)'
            el.style.color = 'var(--ink)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'transparent'
            el.style.color = 'var(--ink-soft)'
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 14, width: 20, textAlign: 'center' }}>
            {EQUIPMENT_SLOT_ICONS[slot]}
          </span>
          <span>{EQUIPMENT_SLOT_LABELS[slot]}</span>
        </button>
      ))}
    </div>
  )
}

// ─── Dice roller ──────────────────────────────────────────────────────────────
function DiceRoller() {
  const [selectedDie, setSelectedDie] = useState<number>(20)
  const [result, setResult] = useState<number | null>(null)
  const [visible, setVisible] = useState(true)
  const dice = [4, 6, 8, 10, 12, 20, 100]

  function roll(sides: number) {
    setSelectedDie(sides)
    setResult(Math.floor(Math.random() * sides) + 1)
  }

  if (!visible) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="pangu-btn pangu-btn-ghost pangu-btn-sm" onClick={() => setVisible(true)}>
          ⬡ Dice
        </button>
      </div>
    )
  }

  return (
    <div
      className="pangu-surface"
      style={{ padding: 20, width: 200, flexShrink: 0 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
          Dice
        </span>
        <button
          type="button"
          aria-label="Verbergen"
          onClick={() => setVisible(false)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '2px 4px', transition: 'color var(--t-fast)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          ✕
        </button>
      </div>

      {/* Roll area */}
      <button
        type="button"
        aria-label={`Gooi d${selectedDie}`}
        onClick={() => roll(selectedDie)}
        style={{
          width: '100%', background: 'var(--surface)',
          border: '1px solid var(--hairline)', borderRadius: 10,
          padding: '16px 12px', marginBottom: 12, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          transition: 'border-color var(--t-fast)',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--violet)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--hairline)' }}
      >
        <svg aria-hidden="true" width="36" height="36" viewBox="0 0 48 48" style={{ opacity: 0.6 }}>
          <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="var(--violet)" strokeWidth="2" />
          {result !== null && <line x1="16" y1="24" x2="32" y2="24" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round" />}
        </svg>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: result !== null ? 28 : 14, fontWeight: 700, color: result !== null ? 'var(--ink)' : 'var(--muted)', lineHeight: 1 }}>
          {result !== null ? result : `D${selectedDie}`}
        </span>
        {result === null
          ? <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-body)' }}>Klik om te gooien</span>
          : <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>D{selectedDie}</span>
        }
      </button>

      {/* Die grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {dice.map((d) => (
          <button
            key={d}
            type="button"
            aria-label={`d${d}`}
            aria-pressed={selectedDie === d}
            onClick={() => roll(d)}
            style={{
              padding: '8px 4px', borderRadius: 8, border: '1px solid',
              borderColor: selectedDie === d ? 'var(--violet)' : 'var(--hairline)',
              background: selectedDie === d ? 'rgba(139,92,246,0.15)' : 'var(--surface)',
              color: selectedDie === d ? 'var(--violet)' : 'var(--ink-soft)',
              fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-body)',
              cursor: 'pointer', transition: 'all var(--t-fast)',
            }}
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

// ─── Item row ─────────────────────────────────────────────────────────────────
function ItemRow({
  item,
  index,
  total,
  onEquip,
  onUnequip,
  onReturn,
  pickerOpen,
  onOpenPicker,
  onClosePicker,
  isPending,
}: {
  item: Item
  index: number
  total: number
  onEquip: (slot: EquipmentSlot) => void
  onUnequip: () => void
  onReturn: () => void
  pickerOpen: boolean
  onOpenPicker: () => void
  onClosePicker: () => void
  isPending: boolean
}) {
  const equippable = isEquippable(item.item_type)
  const isEquipped = !!item.equipped_slot
  const bonuses = formatItemBonuses(item.properties)
  const subtitleParts = [itemTypeLabel[item.item_type], ...(bonuses.length > 0 ? [bonuses.join(' · ')] : [])]

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 0',
        borderBottom: index < total - 1 ? '1px solid var(--hairline)' : 'none',
      }}
    >
      {/* Icon */}
      <div
        aria-hidden="true"
        style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isEquipped ? 'rgba(212,175,55,0.10)' : 'var(--surface)',
          border: `1px solid ${isEquipped ? 'rgba(212,175,55,0.30)' : 'var(--hairline)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background var(--t-fast), border-color var(--t-fast)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isEquipped ? 'var(--gold)' : 'var(--muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14, fontWeight: 600,
          letterSpacing: '0.03em', color: 'var(--ink)',
        }}>
          {item.is_magical && <span style={{ color: 'var(--gold)', marginRight: 3 }} aria-hidden="true">✦</span>}
          {item.name}
        </span>
        <p style={{
          fontSize: 10, color: bonuses.length > 0 ? 'var(--teal)' : 'var(--muted)',
          fontFamily: 'var(--font-body)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
          margin: '2px 0 0', lineHeight: 1.4,
        }}>
          {subtitleParts.join(' · ')}
        </p>
      </div>

      {/* Right: badges + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {/* Equipped slot badge */}
        {isEquipped && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--gold)',
            border: '1px solid rgba(212,175,55,0.35)',
            background: 'rgba(212,175,55,0.08)',
          }}>
            <span aria-hidden="true">{EQUIPMENT_SLOT_ICONS[item.equipped_slot!]}</span>
            {EQUIPMENT_SLOT_LABELS[item.equipped_slot!]}
          </span>
        )}

        {/* Rarity badge */}
        {item.rarity !== 'common' && (
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '2px 8px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: itemRarityColor[item.rarity],
            border: `1px solid ${itemRarityColor[item.rarity]}55`,
            background: `${itemRarityColor[item.rarity]}11`,
          }}>
            {itemRarityLabel[item.rarity]}
          </span>
        )}

        {/* Quantity */}
        {item.quantity > 1 && (
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>×{item.quantity}</span>
        )}

        {/* Equip / unequip */}
        <div style={{ position: 'relative' }}>
          {equippable && !isEquipped && (
            <>
              <button
                type="button"
                aria-label={`${item.name} equippen`}
                onClick={onOpenPicker}
                style={{
                  background: 'none', border: '1px solid var(--hairline)', borderRadius: 6,
                  padding: '4px 8px', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--muted)',
                  transition: 'all var(--t-fast)',
                  fontFamily: 'var(--font-body)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--violet)'
                  el.style.color = 'var(--violet)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--hairline)'
                  el.style.color = 'var(--muted)'
                }}
              >
                Equippen
              </button>
              {pickerOpen && (
                <SlotPicker item={item} onEquip={onEquip} onClose={onClosePicker} />
              )}
            </>
          )}
          {isEquipped && (
            <button
              type="button"
              aria-label={`${item.name} uitrusten`}
              onClick={onUnequip}
              style={{
                background: 'none', border: '1px solid rgba(212,175,55,0.35)', borderRadius: 6,
                padding: '4px 8px', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(212,175,55,0.7)',
                transition: 'all var(--t-fast)',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(255,107,107,0.4)'
                el.style.color = 'var(--crimson)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(212,175,55,0.35)'
                el.style.color = 'rgba(212,175,55,0.7)'
              }}
            >
              Uitrusten
            </button>
          )}
        </div>

        {/* Return to DM */}
        <button
          type="button"
          aria-label={`${item.name} teruggeven aan DM`}
          onClick={onReturn}
          disabled={isPending}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 14, padding: '4px 6px',
            lineHeight: 1, transition: 'color var(--t-fast)',
            opacity: isPending ? 0.4 : 1,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--ink-soft)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--muted)' }}
        >
          ↩
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CharacterDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [pickerItemId, setPickerItemId] = useState<string | null>(null)

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
    onError: () => toast.error('Teruggeven mislukt'),
  })

  const { data: character, isLoading } = useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase.from('characters').select('*').eq('id', id!).single()
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
    onError: () => toast.error('HP bijwerken mislukt'),
  })

  const toggleInspiration = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from('characters')
        .update({ inspiration: value, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('Inspiratie bijwerken mislukt'),
  })

  const updateDeathSaves = useMutation({
    mutationFn: async ({ successes, failures }: { successes: number; failures: number }) => {
      const { error } = await supabase
        .from('characters')
        .update({ death_save_successes: successes, death_save_failures: failures, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
    },
    onError: () => toast.error('Stervensgooien bijwerken mislukt'),
  })

  const updateSpellSlot = useMutation({
    mutationFn: async ({ level, current }: { level: string; current: number }) => {
      const slots = { ...(character?.spell_slots ?? {}) } as SpellSlots
      const key = level as keyof SpellSlots
      if (slots[key]) {
        slots[key] = { ...slots[key]!, current: Math.max(0, Math.min(current, slots[key]!.max)) }
      }
      const { error } = await supabase
        .from('characters')
        .update({ spell_slots: slots, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
    },
    onError: () => toast.error('Spreukslots bijwerken mislukt'),
  })

  const toggleCondition = useMutation({
    mutationFn: async (condition: string) => {
      const current = character?.active_conditions ?? []
      const updated = current.includes(condition)
        ? current.filter(c => c !== condition)
        : [...current, condition]
      const { error } = await supabase
        .from('characters')
        .update({ active_conditions: updated, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
    },
    onError: () => toast.error('Conditie bijwerken mislukt'),
  })

  const updateClassResource = useMutation({
    mutationFn: async ({ name, current }: { name: string; current: number }) => {
      const resources = { ...(character?.class_resources ?? {}) } as ClassResources
      if (resources[name]) {
        resources[name] = { ...resources[name], current: Math.max(0, Math.min(current, resources[name].max)) }
      }
      const { error } = await supabase
        .from('characters')
        .update({ class_resources: resources, updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
    },
    onError: () => toast.error('Resource bijwerken mislukt'),
  })

  const updateTempHp = useMutation({
    mutationFn: async (value: number) => {
      const { error } = await supabase
        .from('characters')
        .update({ temp_hp: Math.max(0, value), updated_at: new Date().toISOString() })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
    },
    onError: () => toast.error('Tijdelijke HP bijwerken mislukt'),
  })

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
  const xp      = character.xp      ?? 0
  const xpNext  = character.xp_next ?? 0
  const hpCurrent = character.hp_current ?? 0
  const hpMax     = character.hp_max     ?? 0
  const xpPct = xpNext > 0 ? Math.min(100, Math.round((xp / xpNext) * 100)) : 0
  const hpPct = hpMax  > 0 ? Math.min(100, Math.round((hpCurrent / hpMax) * 100)) : 0
  const hpLow = hpCurrent < hpMax * 0.3
  const dexMod  = Math.floor(((character.stat_dex ?? 10) - 10) / 2)
  const dexLabel = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`

  // Equipment-adjusted stats
  const equippedItems = (items ?? []).filter((i) => i.equipped_slot !== null)
  const eff = calculateEffectiveStats(character, equippedItems)
  const acBonus = eff.ac - (character.armor_class ?? 0)

  // Subtitle for AC card: names of equipped armor/shields contributing to AC
  const acContributors = equippedItems
    .filter((i) => (i.properties.ac_bonus ?? 0) !== 0)
    .map((i) => i.name)
  const acSubtitle = acContributors.join(' + ')

  // D&D 5.5e derived values
  const profBonus      = character.proficiency_bonus ?? 2
  const isInspired     = character.inspiration ?? false
  const exhaustion     = character.exhaustion ?? 0
  const hitDie         = character.hit_die ?? 'd8'
  const hitDiceCurrent = character.hit_dice_current ?? 1
  const deathSuccesses = character.death_save_successes ?? 0
  const deathFailures  = character.death_save_failures  ?? 0

  // Passive perception/investigation/insight (10 + ability mod + proficiency if applicable + item bonus)
  const wisMod = Math.floor((eff.wis - 10) / 2)
  const intMod = Math.floor((eff.int - 10) / 2)
  const passivePerception   = 10 + wisMod + ((character.proficient_skills ?? []).includes('Waarneming')  ? profBonus : 0) + (eff.skillBonuses['Waarneming']  ?? 0)
  const passiveInvestigation = 10 + intMod + ((character.proficient_skills ?? []).includes('Onderzoek')   ? profBonus : 0) + (eff.skillBonuses['Onderzoek']   ?? 0)
  const passiveInsight       = 10 + wisMod + ((character.proficient_skills ?? []).includes('Inzicht')     ? profBonus : 0) + (eff.skillBonuses['Inzicht']     ?? 0)

  // Spellcasting
  const spellAbility = character.spellcasting_ability ?? null
  const spellAbilityScore = spellAbility === 'int' ? eff.int : spellAbility === 'wis' ? eff.wis : eff.cha
  const spellAbilityMod   = Math.floor((spellAbilityScore - 10) / 2)
  const spellSaveDC        = spellAbility ? 8 + profBonus + spellAbilityMod : null
  const spellAttackBonus   = spellAbility ? profBonus + spellAbilityMod : null

  const activeConditions = character.active_conditions ?? []
  const tempHp           = character.temp_hp ?? 0
  const classResources   = (character.class_resources ?? {}) as ClassResources
  const spellSlots       = (character.spell_slots ?? {}) as SpellSlots

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

      {/* ── Hero: two-column layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 260px) 1fr', gap: 28, marginBottom: 48, alignItems: 'stretch' }}>

        {/* Portrait card */}
        <div style={{ position: 'relative', borderRadius: 'var(--r-xl)', border: '1px solid var(--hairline)', overflow: 'hidden', minHeight: 280, background: `${headerGradient}, linear-gradient(175deg, #141b3a 0%, #0d1228 60%, #0a0e20 100%)` }}>
          {dots.map((dot, i) => (
            <div key={i} aria-hidden="true" style={{ position: 'absolute', left: `${dot.x}%`, top: `${dot.y}%`, width: dot.size, height: dot.size, borderRadius: '50%', background: 'white', opacity: dot.opacity, pointerEvents: 'none' }} />
          ))}
          <svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" style={{ position: 'absolute', left: '26%', top: '28%', opacity: 0.45, pointerEvents: 'none' }}>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="rgba(107,167,255,0.9)" strokeWidth="1.2" fill="none" />
          </svg>
          <div aria-hidden="true" style={{ position: 'absolute', right: '-10%', top: '8%', width: '75%', paddingTop: '75%', borderRadius: '50%', border: '1px solid rgba(245,180,50,0.18)', pointerEvents: 'none' }} />
          <div aria-hidden="true" style={{ position: 'absolute', left: '50%', bottom: '-10%', transform: 'translateX(-50%)', fontFamily: 'var(--font-display)', fontSize: 'clamp(100px,20vw,200px)', fontWeight: 700, color: 'rgba(107,167,255,0.06)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>
            {character.name.charAt(0).toUpperCase()}
          </div>
          <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 2 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 'var(--r-full)', fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: characterStatusColor[character.status], border: `1px solid ${characterStatusColor[character.status]}55`, background: `${characterStatusColor[character.status]}15` }}>
              {characterStatusLabel[character.status]}
            </span>
          </div>
        </div>

        {/* Right info column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {eyebrowParts.length > 0 && (
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'var(--teal)', margin: 0 }}>
              {eyebrowParts.join(' · ')}
            </p>
          )}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(38px, 5.5vw, 72px)', fontWeight: 600, lineHeight: 0.88, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0 }}>
            {character.name}
          </h1>

          {/* Level + XP */}
          <div className="pangu-surface" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)' }}>Level</span>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 700, color: 'var(--gold)', lineHeight: 1 }}>{character.level}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>Experience</span>
                <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontFamily: 'var(--font-body)' }}>{formatXP(xp)} / {formatXP(xpNext)} XP</span>
              </div>
              <div role="progressbar" aria-valuenow={xp} aria-valuemin={0} aria-valuemax={xpNext} aria-label={`${xp} van ${xpNext} ervaringspunten`} style={{ height: 6, borderRadius: 3, background: 'var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${xpPct}%`, background: 'var(--violet)', borderRadius: 3, transition: 'width 0.4s var(--ease-out)' }} />
              </div>
            </div>
          </div>

          {/* 4 combat stat boxes */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="pangu-surface" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: hpLow ? 'var(--crimson)' : 'var(--muted)', margin: 0 }}>HP</p>
                {tempHp > 0 && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--azure)', border: '1px solid rgba(107,167,255,0.35)', borderRadius: 999, padding: '1px 6px' }}>+{tempHp}</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button type="button" aria-label="HP verlagen" onClick={() => updateHp.mutate(Math.max(0, hpCurrent - 1))} disabled={updateHp.isPending || hpCurrent <= 0} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: hpCurrent <= 0 ? 0.4 : 1, flexShrink: 0 }}>−</button>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 700, color: hpLow ? 'var(--crimson)' : 'var(--ink)', margin: 0, lineHeight: 1 }}>{hpCurrent}<span style={{ fontSize: 17, color: 'var(--muted)', fontWeight: 400 }}>/{hpMax}</span></p>
                <button type="button" aria-label="HP verhogen" onClick={() => updateHp.mutate(Math.min(hpMax, hpCurrent + 1))} disabled={updateHp.isPending || hpCurrent >= hpMax} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--hairline)', background: 'var(--surface)', color: 'var(--muted)', cursor: hpCurrent >= hpMax ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, opacity: hpCurrent >= hpMax ? 0.4 : 1, flexShrink: 0 }}>+</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Temp:</span>
                <button type="button" aria-label="Tijdelijke HP verlagen" onClick={() => updateTempHp.mutate(tempHp - 1)} disabled={updateTempHp.isPending || tempHp <= 0} style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: tempHp <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, opacity: tempHp <= 0 ? 0.4 : 1 }}>−</button>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--azure)', minWidth: 18, textAlign: 'center' }}>{tempHp}</span>
                <button type="button" aria-label="Tijdelijke HP verhogen" onClick={() => updateTempHp.mutate(tempHp + 1)} disabled={updateTempHp.isPending} style={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>+</button>
              </div>
              <div role="progressbar" aria-valuenow={hpCurrent} aria-valuemin={0} aria-valuemax={hpMax} aria-label={`${hpCurrent} van ${hpMax} HP`} style={{ height: 4, borderRadius: 2, background: 'var(--hairline)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${hpPct}%`, background: hpLow ? 'var(--crimson)' : 'var(--teal)', borderRadius: 2, transition: 'width 0.3s var(--ease-out)' }} />
              </div>
            </div>
            <div className="pangu-surface" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Armor Class</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {eff.ac}{acBonus > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--teal)', marginLeft: 6 }}>+{acBonus}</span>}
              </p>
              {(acSubtitle || character.subtitle) && <p style={{ fontSize: 11, color: 'var(--ink-soft)', margin: 'auto 0 0', fontStyle: 'italic', lineHeight: 1.4 }}>{acSubtitle || character.subtitle}</p>}
            </div>
            <div className="pangu-surface" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Initiative</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
                {eff.initiative >= 0 ? `+${eff.initiative}` : `${eff.initiative}`}
              </p>
              <p style={{ fontSize: 11, color: 'var(--muted)', margin: 'auto 0 0', fontFamily: 'var(--font-body)' }}>DEX modifier ({dexLabel})</p>
            </div>
            <div className="pangu-surface" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>Speed</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', margin: 0, lineHeight: 1 }}>
                {eff.speed}<span style={{ fontSize: 18, fontWeight: 400, color: 'var(--muted)', marginLeft: 3 }}>ft</span>
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 'auto' }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>Prof +{profBonus}</span>
                {[
                  { label: '🦅', key: 'fly_speed',    title: 'Vliegen'  },
                  { label: '🌊', key: 'swim_speed',   title: 'Zwemmen'  },
                  { label: '🧗', key: 'climb_speed',  title: 'Klimmen'  },
                  { label: '⛏️', key: 'burrow_speed', title: 'Graven'   },
                ].filter(s => (character[s.key as keyof Character] as number ?? 0) > 0).map(s => (
                  <span key={s.key} title={s.title} style={{ fontSize: 11, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <span aria-hidden="true">{s.label}</span>
                    {character[s.key as keyof Character] as number}ft
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div role="tablist" aria-label="Karakter tabs" className="pangu-tab-bar" style={{ marginBottom: 24 }}>
        {([
          { key: 'stats',        label: 'Stats' },
          { key: 'spreuken',     label: 'Spreuken' },
          { key: 'inventaris',   label: `Inventaris${items && items.length > 0 ? ` (${items.length})` : ''}` },
          { key: 'vaardigheden', label: 'Vaardigheden' },
          { key: 'lore',         label: 'Lore' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button key={key} type="button" role="tab" aria-selected={activeTab === key} aria-controls={`tabpanel-${key}`} id={`tab-${key}`} onClick={() => setActiveTab(key)} className="pangu-tab">
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════ STATS ════════════════════════════════ */}
      <div id="tabpanel-stats" role="tabpanel" aria-labelledby="tab-stats" hidden={activeTab !== 'stats'}>

        {/* ── Inspiratie / Trefferdobbelstenen / Uitputting ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          {/* Inspiratie */}
          <button
            type="button"
            aria-pressed={isInspired}
            aria-label={isInspired ? 'Inspiratie actief — klik om te verwijderen' : 'Geen inspiratie — klik om toe te voegen'}
            onClick={() => toggleInspiration.mutate(!isInspired)}
            disabled={toggleInspiration.isPending}
            className="pangu-surface"
            style={{
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', textAlign: 'left',
              background: isInspired ? 'rgba(234,179,8,0.08)' : undefined,
              borderColor: isInspired ? 'rgba(234,179,8,0.35)' : undefined,
              transition: 'background var(--t-fast), border-color var(--t-fast)',
              border: `1px solid ${isInspired ? 'rgba(234,179,8,0.35)' : 'var(--hairline)'}`,
            }}
          >
            <span aria-hidden="true" style={{ fontSize: 22, color: isInspired ? 'var(--gold)' : 'var(--muted)' }}>
              {isInspired ? '✦' : '✧'}
            </span>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: isInspired ? 'var(--gold)' : 'var(--muted)', margin: '0 0 3px' }}>Inspiratie</p>
              <p style={{ fontSize: 14, fontWeight: isInspired ? 700 : 400, color: isInspired ? 'var(--gold)' : 'var(--ink-soft)', margin: 0 }}>
                {isInspired ? 'Geïnspireerd' : 'Geen'}
              </p>
            </div>
          </button>

          {/* Trefferdobbelstenen */}
          <div className="pangu-surface" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>
              Trefferdobbelstenen
            </p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', lineHeight: 1 }}>
              {hitDiceCurrent}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--muted)' }}>/{character.level} {hitDie}</span>
            </p>
            <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginTop: 4 }}>
              {Array.from({ length: Math.min(character.level, 20) }, (_, i) => (
                <div
                  key={i}
                  aria-hidden="true"
                  style={{
                    width: character.level > 12 ? 6 : 8,
                    height: character.level > 12 ? 6 : 8,
                    borderRadius: 2,
                    background: i < hitDiceCurrent ? 'var(--teal)' : 'var(--hairline)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Uitputting */}
          {exhaustion > 0 && (
            <div className="pangu-surface" style={{ padding: '16px 20px', borderColor: exhaustion >= 5 ? 'rgba(220,38,38,0.3)' : 'rgba(234,179,8,0.25)', background: exhaustion >= 5 ? 'rgba(220,38,38,0.04)' : 'rgba(234,179,8,0.04)' }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: '0 0 4px' }}>Uitputting</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: '0 0 4px', lineHeight: 1 }}>
                {exhaustion}<span style={{ fontSize: 14, color: 'var(--muted)', fontWeight: 400 }}>/10</span>
              </p>
              <p style={{ fontSize: 11, color: exhaustion >= 5 ? 'var(--crimson)' : 'var(--gold)', margin: 0 }}>
                {exhaustion === 10 ? 'Dood' : `−${exhaustion * 2} op d20-gooien`}
              </p>
            </div>
          )}
        </div>

        {/* ── Stervensgooien (bij 0 HP) ── */}
        {hpCurrent === 0 && (
          <div className="pangu-surface" style={{ padding: 20, marginBottom: 16, borderColor: 'rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.04)' }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--crimson)', margin: '0 0 14px' }}>
              Stervensgooien
            </p>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--teal)', fontWeight: 600, margin: '0 0 8px' }}>Successen</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(n => {
                    const filled = deathSuccesses >= n
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Succes ${n}: ${filled ? 'geslaagd' : 'leeg'}`}
                        onClick={() => updateDeathSaves.mutate({ successes: filled ? n - 1 : n, failures: deathFailures })}
                        disabled={updateDeathSaves.isPending}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: filled ? '2px solid rgba(62,207,178,0.6)' : '2px solid var(--hairline-strong)',
                          background: filled ? 'rgba(62,207,178,0.15)' : 'var(--surface)',
                          cursor: 'pointer', fontSize: 16,
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
              <div>
                <p style={{ fontSize: 11, color: 'var(--crimson)', fontWeight: 600, margin: '0 0 8px' }}>Mislukkingen</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3].map(n => {
                    const filled = deathFailures >= n
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`Mislukking ${n}: ${filled ? 'mislukt' : 'leeg'}`}
                        onClick={() => updateDeathSaves.mutate({ successes: deathSuccesses, failures: filled ? n - 1 : n })}
                        disabled={updateDeathSaves.isPending}
                        style={{
                          width: 36, height: 36, borderRadius: 8,
                          border: filled ? '2px solid rgba(220,38,38,0.5)' : '2px solid var(--hairline-strong)',
                          background: filled ? 'rgba(220,38,38,0.12)' : 'var(--surface)',
                          cursor: 'pointer', fontSize: 16,
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
        )}

        {/* ── Passieve stats ── */}
        <div className="pangu-surface" style={{ padding: '14px 20px', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Passieve Waarneming',   value: passivePerception    },
              { label: 'Passieve Onderzoek',     value: passiveInvestigation },
              { label: 'Passief Inzicht',        value: passiveInsight       },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>{label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
              </div>
            ))}
            {(character.darkvision ?? 0) > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, letterSpacing: '0.08em' }}>Duisterzicht</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{character.darkvision} ft</span>
              </div>
            )}
          </div>
          {character.special_senses && (
            <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8, marginBottom: 0 }}>
              {character.special_senses}
            </p>
          )}
        </div>

        {/* ── Condities ── */}
        <div className="pangu-surface" style={{ padding: '16px 20px', marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 10px' }}>Condities</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CONDITIONS.map(cond => {
              const active = activeConditions.includes(cond)
              return (
                <button
                  key={cond}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCondition.mutate(cond)}
                  disabled={toggleCondition.isPending}
                  style={{
                    fontSize: 11, padding: '4px 10px', borderRadius: 999, cursor: 'pointer',
                    border: active ? '1px solid rgba(220,38,38,0.5)' : '1px solid var(--hairline)',
                    background: active ? 'rgba(220,38,38,0.12)' : 'var(--surface)',
                    color: active ? 'var(--crimson)' : 'var(--muted)',
                    fontWeight: active ? 700 : 400,
                    transition: 'all var(--t-fast)',
                  }}
                >
                  {cond}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Klasseresources ── */}
        {Object.keys(classResources).length > 0 && (
          <div className="pangu-surface" style={{ padding: '16px 20px', marginBottom: 16 }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>Klasseresources</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {Object.entries(classResources).map(([name, res]) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 2px' }}>{name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button type="button" aria-label={`${name} verlagen`} onClick={() => updateClassResource.mutate({ name, current: res.current - 1 })} disabled={updateClassResource.isPending || res.current <= 0} style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: res.current <= 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: res.current <= 0 ? 0.4 : 1 }}>−</button>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: 'var(--teal)', minWidth: 28, textAlign: 'center' }}>{res.current}</span>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>/{res.max}</span>
                      <button type="button" aria-label={`${name} verhogen`} onClick={() => updateClassResource.mutate({ name, current: res.current + 1 })} disabled={updateClassResource.isPending || res.current >= res.max} style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--hairline)', background: 'none', color: 'var(--muted)', cursor: res.current >= res.max ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, opacity: res.current >= res.max ? 0.4 : 1 }}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ability scores */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}>
          {abilityScores.map(({ key, abbr, label }) => {
            const baseScore = character[key] as number
            const effKey = key.replace('stat_', '') as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha'
            const effectiveScore = eff[effKey]
            const bonus = effectiveScore - baseScore
            const mod = abilityModifier(effectiveScore)
            return (
              <div key={key} style={{ background: 'var(--surface)', border: `1px solid ${bonus !== 0 ? 'rgba(62,207,178,0.35)' : 'var(--hairline)'}`, borderRadius: 10, padding: '12px 6px 10px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', margin: 0 }}>{label}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: 'var(--gold)', margin: 0, lineHeight: 1 }}>{mod}</p>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>{effectiveScore}</span>
                </div>
                {bonus !== 0 && (
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--teal)' }}>
                    {bonus > 0 ? `+${bonus}` : bonus}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Reddingsgooien */}
        <div className="pangu-surface" style={{ padding: 24, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Reddingsgooien</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {SAVING_THROWS.map(({ label, abbr, statKey }) => {
              const score = eff[statKey.replace('stat_', '') as 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha']
              const mod = Math.floor((score - 10) / 2)
              const isProficient = (character.saving_throw_proficiencies ?? []).includes(label)
              const total = mod + (isProficient ? profBonus : 0)
              const totalLabel = total >= 0 ? `+${total}` : `${total}`
              return (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 12px', borderRadius: 8,
                  background: isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                  border: isProficient ? '1px solid rgba(139,92,246,0.25)' : '1px solid var(--hairline)',
                }}>
                  <span aria-label={isProficient ? `${label}: vaardig` : `${label}: niet vaardig`} style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: isProficient ? 'var(--violet)' : 'transparent',
                    border: `2px solid ${isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', fontWeight: 700, letterSpacing: '0.08em' }}>{abbr}</span>
                    <span style={{ fontSize: 10, color: 'var(--subtle)' }}>{label}</span>
                  </div>
                  <span style={{
                    fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700,
                    color: isProficient ? 'var(--violet)' : 'var(--ink-soft)',
                  }}>
                    {totalLabel}
                  </span>
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
              <span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>Traits<span aria-hidden="true" style={{ color: 'var(--gold)', fontSize: 12 }}>✦</span>
            </span>
            <div style={{ flex: 1, height: 1, background: 'var(--hairline)' }} />
          </div>
          <div className="pangu-surface" style={{ padding: '18px 20px' }}>
            {character.description
              ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
              : <p style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Kenmerken worden hier weergegeven wanneer ze zijn toegevoegd.</p>
            }
          </div>
        </div>

        {/* Currency */}
        {(character.platinum > 0 || character.gold > 0 || character.electrum > 0 || character.silver > 0 || character.copper > 0) && (
          <div className="pangu-surface" style={{ padding: 24 }}>
            <p className="pangu-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              {[
                { label: 'Platina', value: character.platinum ?? 0, color: '#e5e7eb', suffix: 'pp' },
                { label: 'Goud',    value: character.gold,          color: 'var(--gold)', suffix: 'gp' },
                { label: 'Elektrum',value: character.electrum ?? 0, color: '#c0a060',  suffix: 'ep' },
                { label: 'Zilver',  value: character.silver,        color: 'var(--ink-soft)', suffix: 'sp' },
                { label: 'Koper',   value: character.copper,        color: '#b87333',  suffix: 'cp' },
              ].filter(c => c.value > 0).map(({ label, value, color, suffix }) => (
                <div key={label} style={{ textAlign: 'center', minWidth: 64 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 4px' }}>{label}</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color, margin: 0, fontFamily: 'var(--font-display)' }}>
                    {value}<span style={{ fontSize: 11, opacity: 0.6, marginLeft: 2 }}>{suffix}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════ SPREUKEN ════════════════════════════ */}
      <div id="tabpanel-spreuken" role="tabpanel" aria-labelledby="tab-spreuken" hidden={activeTab !== 'spreuken'}>
        {!spellAbility ? (
          <div className="pangu-surface" style={{ padding: '32px 28px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-soft)', margin: '0 0 8px' }}>Geen toverbaarheid</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Stel een toverbaarheids-eigenschap in via{' '}
              <a href={`/characters/${id}/edit`} style={{ color: 'var(--violet)', textDecoration: 'none' }}>Bewerken</a>
              {' '}om spreukslots te beheren.
            </p>
          </div>
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

                {/* Concentration */}
                <div style={{ marginLeft: 'auto' }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>Concentratie</p>
                  {character.concentrating ? (
                    <div style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(62,207,178,0.1)', border: '1px solid rgba(62,207,178,0.4)' }}>
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
                  <a href={`/characters/${id}/edit`} style={{ color: 'var(--violet)', textDecoration: 'none' }}>Bewerken</a>.
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {(['1','2','3','4','5','6','7','8','9'] as const).filter(level => {
                    const slot = spellSlots[level]
                    return slot && slot.max > 0
                  }).map(level => {
                    const slot = spellSlots[level]!
                    const levelIdx = parseInt(level, 10) - 1
                    return (
                      <div key={level}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', minWidth: 64 }}>
                            {SPELL_LEVEL_LABELS[levelIdx]} niveau
                          </span>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{slot.current}/{slot.max}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {Array.from({ length: slot.max }, (_, i) => {
                            const used = i >= slot.current
                            return (
                              <button
                                key={i}
                                type="button"
                                aria-label={used ? `Slot ${i + 1} herstellen` : `Slot ${i + 1} gebruiken`}
                                onClick={() => updateSpellSlot.mutate({ level, current: used ? slot.current + 1 : slot.current - 1 })}
                                disabled={updateSpellSlot.isPending}
                                style={{
                                  width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
                                  border: used ? '2px solid var(--hairline-strong)' : '2px solid rgba(139,92,246,0.5)',
                                  background: used ? 'var(--surface)' : 'rgba(139,92,246,0.12)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  transition: 'all var(--t-fast)',
                                }}
                              >
                                <span aria-hidden="true" style={{ fontSize: 16, color: used ? 'var(--muted)' : 'var(--violet)' }}>
                                  {used ? '○' : '✦'}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════ INVENTARIS ══════════════════════════ */}
      <div id="tabpanel-inventaris" role="tabpanel" aria-labelledby="tab-inventaris" hidden={activeTab !== 'inventaris'}>
        {isLoadingItems ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
            <Spinner size="md" />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* ── Main list ── */}
            <div style={{ flex: 1, minWidth: 260 }}>

              {/* Section header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                  Equipment
                  {equippedItems.length > 0 && (
                    <span style={{ marginLeft: 8, color: 'var(--gold)' }}>
                      {equippedItems.length} uitgerust
                    </span>
                  )}
                </span>
              </div>

              {/* Item list */}
              {items && items.length > 0 ? (
                <div>
                  {items.map((item, idx) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      index={idx}
                      total={items.length}
                      onEquip={(slot) => {
                        equipItem.mutate({ itemId: item.id, slot })
                        toast.success(`${item.name} uitgerust in ${EQUIPMENT_SLOT_LABELS[slot]}`)
                      }}
                      onUnequip={() => {
                        unequipItem.mutate(item.id)
                        toast.success(`${item.name} uitgerust`)
                      }}
                      onReturn={() => returnItemToDm.mutate(item.id)}
                      pickerOpen={pickerItemId === item.id}
                      onOpenPicker={() => setPickerItemId(item.id)}
                      onClosePicker={() => setPickerItemId(null)}
                      isPending={returnItemToDm.isPending}
                    />
                  ))}
                </div>
              ) : (
                <div className="pangu-surface" style={{ padding: 28, textAlign: 'center' }}>
                  <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen items in je inventaris.</p>
                  <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '8px 0 0' }}>De DM kan items toewijzen vanuit de kroniek-schatkist.</p>
                </div>
              )}
            </div>

            {/* ── Right sidebar ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Treasury */}
              {(character.platinum > 0 || character.gold > 0 || character.electrum > 0 || character.silver > 0 || character.copper > 0) && (
                <div className="pangu-surface" style={{ padding: '16px 20px', width: 200 }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>Treasury</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {[
                      { label: 'Platina',  value: character.platinum ?? 0, color: '#e5e7eb',          suffix: 'pp' },
                      { label: 'Gold',     value: character.gold,          color: 'var(--gold)',       suffix: 'gp' },
                      { label: 'Elektrum', value: character.electrum ?? 0, color: '#c0a060',           suffix: 'ep' },
                      { label: 'Silver',   value: character.silver,        color: 'var(--ink-soft)',   suffix: 'sp' },
                      { label: 'Copper',   value: character.copper,        color: '#b87333',           suffix: 'cp' },
                    ].filter(c => c.value > 0).map(({ label, value, color, suffix }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{label}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color, fontFamily: 'var(--font-body)' }}>
                          {value} <span style={{ fontSize: 10, opacity: 0.7 }}>{suffix}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dice roller */}
              <DiceRoller />
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════ VAARDIGHEDEN ════════════════════════ */}
      <div id="tabpanel-vaardigheden" role="tabpanel" aria-labelledby="tab-vaardigheden" hidden={activeTab !== 'vaardigheden'}>
        {eff.stealthDisadvantage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 10, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', marginBottom: 16 }}>
            <span aria-hidden="true">⚠️</span>
            <p style={{ fontSize: 13, color: 'var(--crimson)', margin: 0, fontWeight: 500 }}>
              Nadeel op Sluipen door uitgerust zwaar pantser.
            </p>
          </div>
        )}
        <div className="pangu-surface" style={{ padding: 24 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Vaardigheden</p>
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 0, marginBottom: 20 }}>
            <span style={{ color: 'var(--violet)', fontWeight: 600 }}>●</span> vaardig (+{character.proficiency_bonus ?? 0}) &nbsp;·&nbsp;
            <span style={{ color: 'var(--teal)', fontWeight: 600 }}>◎</span> expertise (×2 bonus)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {SKILLS.map((skill) => {
              const isProficient = (character.proficient_skills ?? []).includes(skill.name)
              const isExpert     = (character.expertise_skills  ?? []).includes(skill.name)
              const baseScore    = (character[skill.ability] as number | null) ?? 10
              const baseMod      = Math.floor((baseScore - 10) / 2)
              const skillBonus   = isExpert ? (character.proficiency_bonus ?? 0) * 2 : isProficient ? (character.proficiency_bonus ?? 0) : 0
              const itemBonus    = eff.skillBonuses[skill.name] ?? 0
              const totalMod     = baseMod + skillBonus + itemBonus
              const modLabel     = totalMod >= 0 ? `+${totalMod}` : `${totalMod}`
              const state        = isExpert ? 'expertise' : isProficient ? 'vaardig' : 'geen'
              return (
                <div key={skill.name} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 8,
                  background: isExpert ? 'rgba(62,207,178,0.08)' : isProficient ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
                  border: isExpert ? '1px solid rgba(62,207,178,0.3)' : isProficient ? '1px solid rgba(139,92,246,0.3)' : '1px solid var(--hairline)',
                  transition: 'background var(--t-fast), border-color var(--t-fast)',
                }}>
                  <span
                    aria-label={`${skill.name}: ${state}`}
                    style={{
                      width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                      background: isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'transparent',
                      border: `2px solid ${isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'var(--hairline-strong)'}`,
                      boxShadow: isExpert ? '0 0 0 2px rgba(62,207,178,0.3)' : 'none',
                    }}
                  />
                  <span style={{ flex: 1, fontSize: 13, color: isExpert ? 'var(--teal)' : isProficient ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: (isProficient || isExpert) ? 600 : 400 }}>
                    {skill.name}
                    <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 5, fontWeight: 400 }}>{skill.abbr}</span>
                    {isExpert && <span style={{ fontSize: 9, color: 'var(--teal)', marginLeft: 5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>EXP</span>}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {itemBonus !== 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--teal)' }}>{itemBonus > 0 ? `+${itemBonus}` : itemBonus}</span>
                    )}
                    <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: isExpert ? 'var(--teal)' : isProficient ? 'var(--violet)' : 'var(--ink-soft)', minWidth: 28, textAlign: 'right' }}>
                      {modLabel}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Bekwaamheden & Talen (onderaan vaardigheden tab) */}
        {(() => {
          const languages      = character.languages ?? []
          const toolProf       = character.tool_proficiencies ?? []
          const weaponProf     = character.weapon_proficiencies ?? []
          const armorProf      = character.armor_proficiencies ?? []
          const hasAny         = languages.length > 0 || toolProf.length > 0 || weaponProf.length > 0 || armorProf.length > 0
          if (!hasAny) return null
          return (
            <div className="pangu-surface" style={{ padding: 24, marginTop: 12 }}>
              <p className="pangu-section-title" style={{ marginBottom: 16 }}>Bekwaamheden &amp; Talen</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Talen',                     items: languages  },
                  { label: 'Wapenbekwaamheden',          items: weaponProf },
                  { label: 'Wapenrustingbekwaamheden',   items: armorProf  },
                  { label: 'Gereedschapsbekwaamheden',   items: toolProf   },
                ].filter(g => g.items.length > 0).map(({ label, items }) => (
                  <div key={label}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 8px' }}>{label}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {items.map(item => (
                        <span key={item} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: 'var(--surface)', border: '1px solid var(--hairline)', color: 'var(--ink-soft)' }}>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })()}
      </div>

      {/* ════════════════════════════════ LORE ════════════════════════════════ */}
      <div id="tabpanel-lore" role="tabpanel" aria-labelledby="tab-lore" hidden={activeTab !== 'lore'}>
        {/* Achtergrond */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 12 }}>Achtergrond</p>
          {character.alignment && (
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 12px', fontStyle: 'italic' }}>
              Uitlijning: <span style={{ color: 'var(--ink-soft)', fontStyle: 'normal' }}>{character.alignment}</span>
            </p>
          )}
          {character.description
            ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.description}</p>
            : <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>Nog geen achtergrondverhaal toegevoegd.</p>
          }
        </div>

        {/* Karaktereigenschappen */}
        {(character.personality_traits || character.ideals || character.bonds || character.flaws) && (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 16 }}>Karaktereigenschappen</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {[
                { label: 'Persoonlijkheidskenmerken', value: character.personality_traits },
                { label: 'Idealen',                   value: character.ideals            },
                { label: 'Banden',                    value: character.bonds             },
                { label: 'Gebreken',                  value: character.flaws             },
              ].filter(f => f.value).map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 6px' }}>{label}</p>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Uiterlijk */}
        {(character.age || character.height || character.weight || character.appearance) && (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Uiterlijk</p>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: character.appearance ? 14 : 0 }}>
              {character.age    && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Leeftijd</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.age}</p></div>}
              {character.height && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Lengte</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.height}</p></div>}
              {character.weight && <div><p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 3px' }}>Gewicht</p><p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>{character.weight}</p></div>}
            </div>
            {character.appearance && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.appearance}</p>
            )}
          </div>
        )}

        {/* Talenten */}
        {(character.feats ?? []).length > 0 && (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Talenten</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(character.feats ?? []).map(feat => (
                <span key={feat} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', color: 'var(--ink-soft)' }}>
                  {feat}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Wapenmeesters */}
        {(character.weapon_masteries ?? []).length > 0 && (
          <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
            <p className="pangu-section-title" style={{ marginBottom: 12 }}>Wapenmeesters</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(character.weapon_masteries ?? []).map(m => (
                <span key={m} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 8, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: 'var(--gold)' }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Privénotities */}
        <div className="pangu-surface" style={{ padding: 28, borderColor: 'rgba(107,167,255,0.18)', background: 'rgba(107,167,255,0.03)' }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>✦ Privénotities</p>
          <p style={{ fontSize: 12, color: 'var(--azure)', marginBottom: 16, marginTop: 0 }}>Alleen zichtbaar voor jou</p>
          {character.notes
            ? <p style={{ fontSize: 14, lineHeight: 1.75, color: 'var(--ink-soft)', margin: 0, whiteSpace: 'pre-wrap' }}>{character.notes}</p>
            : <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen notities.</p>
          }
        </div>
      </div>
    </div>
  )
}
