import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { SanctumInventory } from '@/components/character/SanctumInventory'
import { itemRarityLabel, itemRarityColor, itemTypeLabel } from '@/lib/statusMaps'
import { useCharacterItems } from '@/hooks/queries/useCharacterItems'
import { useReturnItemToDm } from '@/hooks/queries/useCharacter'
import {
  EQUIPMENT_SLOT_LABELS,
  EQUIPMENT_SLOT_ICONS,
  ALLOWED_SLOTS_BY_TYPE,
  isEquippable,
  formatItemBonuses,
} from '@/utils/equipmentUtils'
import type { EquipmentSlot, Item } from '@/types/item.types'
import type { Character } from '@/types/character.types'

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
            el.style.background = 'rgb(var(--violet-rgb) / 0.12)'
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
        <Button variant="ghost" size="sm" onClick={() => setVisible(true)}>
          ⬡ Dice
        </Button>
      </div>
    )
  }

  return (
    <div className="surface" style={{ padding: 20, width: 200, flexShrink: 0 }}>
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
              background: selectedDie === d ? 'rgb(var(--violet-rgb) / 0.15)' : 'var(--surface)',
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
      <div
        aria-hidden="true"
        style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: isEquipped ? 'rgb(var(--gold-rgb) / 0.10)' : 'var(--surface)',
          border: `1px solid ${isEquipped ? 'rgb(var(--gold-rgb) / 0.30)' : 'var(--hairline)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background var(--t-fast), border-color var(--t-fast)',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isEquipped ? 'var(--gold)' : 'var(--muted)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      </div>

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

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {isEquipped && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--gold)',
            border: '1px solid rgb(var(--gold-rgb) / 0.35)',
            background: 'rgb(var(--gold-rgb) / 0.08)',
          }}>
            <span aria-hidden="true">{EQUIPMENT_SLOT_ICONS[item.equipped_slot!]}</span>
            {EQUIPMENT_SLOT_LABELS[item.equipped_slot!]}
          </span>
        )}

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

        {item.quantity > 1 && (
          <span style={{ fontSize: 12, color: 'var(--ink-soft)', fontWeight: 600 }}>×{item.quantity}</span>
        )}

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
                background: 'none', border: '1px solid rgb(var(--gold-rgb) / 0.35)', borderRadius: 6,
                padding: '4px 8px', cursor: 'pointer',
                fontSize: 11, fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgb(var(--gold-rgb) / 0.7)',
                transition: 'all var(--t-fast)',
                fontFamily: 'var(--font-body)',
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgb(var(--crimson-rgb) / 0.4)'
                el.style.color = 'var(--crimson)'
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgb(var(--gold-rgb) / 0.35)'
                el.style.color = 'rgb(var(--gold-rgb) / 0.7)'
              }}
            >
              Uitrusten
            </button>
          )}
        </div>

        <button
          type="button"
          aria-label={`${item.name} teruggeven aan DM`}
          title="Teruggeven aan DM"
          onClick={onReturn}
          disabled={isPending}
          style={{
            background: 'none', border: '1px solid var(--hairline)', borderRadius: 6,
            cursor: 'pointer', color: 'var(--muted)', fontSize: 10,
            padding: '4px 8px', lineHeight: 1, transition: 'all var(--t-fast)',
            opacity: isPending ? 0.4 : 1, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            display: 'flex', alignItems: 'center', gap: 4,
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'rgb(var(--crimson-rgb) / 0.4)'
            el.style.color = 'var(--crimson)'
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement
            el.style.borderColor = 'var(--hairline)'
            el.style.color = 'var(--muted)'
          }}
        >
          <span aria-hidden="true">↩</span>
          <span>DM</span>
        </button>
      </div>
    </div>
  )
}

// ─── Tab ──────────────────────────────────────────────────────────────────────
interface Props {
  characterId: string
  character: Character
}

export function CharacterInventoryTab({ characterId, character }: Props) {
  const [pickerItemId, setPickerItemId] = useState<string | null>(null)

  const { data: items, isLoading: isLoadingItems, equipItem, unequipItem } = useCharacterItems(characterId)
  const returnItemToDm = useReturnItemToDm(characterId)

  const equippedItems = (items ?? []).filter((i) => i.equipped_slot !== null)

  return (
    <div id="tabpanel-inventaris" role="tabpanel" aria-labelledby="tab-inventaris">
      {isLoadingItems ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }} aria-live="polite" aria-busy="true">
          <Spinner size="md" />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Paper-doll equipment overview */}
          {items && items.length > 0 && (
            <div className="surface" style={{ padding: 20 }}>
              <p className="pg-section-title" style={{ marginBottom: 16 }}>Uitrusting</p>
              <SanctumInventory
                characterId={characterId}
                items={items}
                onUnequip={(slot) =>
                  unequipItem.mutate(
                    (items ?? []).find((i) => i.equipped_slot === slot)?.id ?? '',
                    { onSuccess: () => toast.success('Item afgelegd') }
                  )
                }
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Main list */}
          <div style={{ flex: 1, minWidth: 260 }}>
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

            {items && items.length > 0 ? (
              <div>
                {items.map((item, idx) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    index={idx}
                    total={items.length}
                    onEquip={(slot) => {
                      equipItem.mutate({ itemId: item.id, slot }, {
                        onSuccess: () => toast.success(`${item.name} uitgerust in ${EQUIPMENT_SLOT_LABELS[slot]}`),
                      })
                    }}
                    onUnequip={() => {
                      unequipItem.mutate(item.id, {
                        onSuccess: () => toast.success(`${item.name} afgelegd`),
                      })
                    }}
                    onReturn={() => returnItemToDm.mutate(item.id)}
                    pickerOpen={pickerItemId === item.id}
                    onOpenPicker={() => setPickerItemId(item.id)}
                    onClosePicker={() => setPickerItemId(null)}
                    isPending={returnItemToDm.isPending && returnItemToDm.variables === item.id}
                  />
                ))}
              </div>
            ) : (
              <div className="surface" style={{ padding: 28, textAlign: 'center' }}>
                <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Geen items in je inventaris.</p>
                <p style={{ fontSize: 12, color: 'var(--subtle)', margin: '8px 0 0' }}>De DM kan items toewijzen vanuit de kroniek-schatkist.</p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(character.platinum > 0 || character.gold > 0 || character.electrum > 0 || character.silver > 0 || character.copper > 0) && (
              <div className="surface" style={{ padding: '16px 20px', width: 200 }}>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', margin: '0 0 12px' }}>Schatkist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: 'Platina',  value: character.platinum ?? 0, color: '#e5e7eb',          suffix: 'pp' },
                    { label: 'Goud',     value: character.gold,          color: 'var(--gold)',       suffix: 'gp' },
                    { label: 'Elektrum', value: character.electrum ?? 0, color: '#c0a060',           suffix: 'ep' },
                    { label: 'Zilver',   value: character.silver,        color: 'var(--ink-soft)',   suffix: 'sp' },
                    { label: 'Koper',    value: character.copper,        color: '#b87333',           suffix: 'cp' },
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
            <DiceRoller />
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
