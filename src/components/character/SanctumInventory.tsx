import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOT_ICONS } from '@/utils/equipmentUtils'
import { itemRarityColor } from '@/lib/statusMaps'
import type { EquipmentSlot, Item } from '@/types/item.types'

export interface SanctumInventoryProps {
  characterId: string
  /** All items for this character */
  items?: Item[]
  onEquip?: (itemId: string, slot: EquipmentSlot) => void
  onUnequip?: (slot: EquipmentSlot) => void
  className?: string
}

const SLOT_LAYOUT: { slot: EquipmentSlot; column: 'left' | 'center' | 'right' }[] = [
  { slot: 'main_hand', column: 'left'   },
  { slot: 'gloves',    column: 'left'   },
  { slot: 'ring1',     column: 'left'   },
  { slot: 'head',      column: 'center' },
  { slot: 'neck',      column: 'center' },
  { slot: 'chest',     column: 'center' },
  { slot: 'boots',     column: 'center' },
  { slot: 'off_hand',  column: 'right'  },
  { slot: 'cloak',     column: 'right'  },
  { slot: 'ring2',     column: 'right'  },
]

function rarityGlow(rarity: Item['rarity']): string {
  const color = itemRarityColor[rarity]
  return `0 0 10px ${color}55, 0 0 4px ${color}33`
}

function SlotCell({
  slot,
  item,
  onUnequip,
}: {
  slot: EquipmentSlot
  item: Item | undefined
  onUnequip?: (slot: EquipmentSlot) => void
}) {
  const label = EQUIPMENT_SLOT_LABELS[slot]
  const icon  = EQUIPMENT_SLOT_ICONS[slot]

  return (
    <div
      title={item ? `${item.name} (${label})` : label}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        padding: '10px 8px',
        borderRadius: 10,
        border: item
          ? `1px solid ${itemRarityColor[item.rarity]}66`
          : '1px dashed var(--hairline-strong)',
        background: item
          ? `rgb(var(--gold-rgb) / 0.06)`
          : 'var(--surface)',
        boxShadow: item && item.rarity !== 'common' ? rarityGlow(item.rarity) : 'none',
        minHeight: 72,
        transition: 'all var(--t-base)',
        cursor: item && onUnequip ? 'pointer' : 'default',
        minWidth: 72,
      }}
      role={item && onUnequip ? 'button' : undefined}
      tabIndex={item && onUnequip ? 0 : undefined}
      aria-label={
        item
          ? `${item.name} uitgerust in ${label}${onUnequip ? ' — klik om af te leggen' : ''}`
          : `${label} — leeg`
      }
      onClick={() => item && onUnequip?.(slot)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && item && onUnequip) {
          e.preventDefault()
          onUnequip(slot)
        }
      }}
    >
      <span aria-hidden="true" style={{ fontSize: 16, opacity: item ? 1 : 0.35 }}>
        {icon}
      </span>
      {item ? (
        <>
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: itemRarityColor[item.rarity],
              textAlign: 'center',
              lineHeight: 1.2,
              maxWidth: 64,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.name}
          </span>
          {item.is_magical && (
            <span aria-hidden="true" style={{ fontSize: 8, color: 'var(--gold)', position: 'absolute', top: 4, right: 5 }}>✦</span>
          )}
        </>
      ) : (
        <span
          style={{
            fontSize: 9,
            color: 'var(--subtle)',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: '0.04em',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}

/** Paper-doll equipment silhouette with 10 slots + backpack grid. */
export function SanctumInventory({
  items = [],
  onEquip: _onEquip,
  onUnequip,
  className,
}: SanctumInventoryProps) {
  const equippedMap: Partial<Record<EquipmentSlot, Item>> = {}
  for (const item of items) {
    if (item.equipped_slot) equippedMap[item.equipped_slot] = item
  }

  const backpackItems = items.filter((i) => !i.equipped_slot)

  const leftSlots   = SLOT_LAYOUT.filter((s) => s.column === 'left')
  const centerSlots = SLOT_LAYOUT.filter((s) => s.column === 'center')
  const rightSlots  = SLOT_LAYOUT.filter((s) => s.column === 'right')

  return (
    <div className={className}>
      {/* Paper-doll layout: 3 columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          gap: 8,
          alignItems: 'start',
        }}
        aria-label="Uitrustingsslots"
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leftSlots.map(({ slot }) => (
            <SlotCell
              key={slot}
              slot={slot}
              item={equippedMap[slot]}
              onUnequip={onUnequip}
            />
          ))}
        </div>

        {/* Center column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 84 }}>
          {centerSlots.map(({ slot }) => (
            <SlotCell
              key={slot}
              slot={slot}
              item={equippedMap[slot]}
              onUnequip={onUnequip}
            />
          ))}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rightSlots.map(({ slot }) => (
            <SlotCell
              key={slot}
              slot={slot}
              item={equippedMap[slot]}
              onUnequip={onUnequip}
            />
          ))}
        </div>
      </div>

      {/* Backpack grid */}
      {backpackItems.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              margin: '0 0 10px',
            }}
          >
            Rugzak ({backpackItems.length})
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 6,
            }}
            aria-label="Rugzakitems"
          >
            {backpackItems.map((item) => (
              <div
                key={item.id}
                title={item.name}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  padding: '8px 6px',
                  borderRadius: 8,
                  border: `1px solid ${item.rarity !== 'common' ? `${itemRarityColor[item.rarity]}44` : 'var(--hairline)'}`,
                  background: 'var(--surface)',
                  minHeight: 56,
                }}
                aria-label={`${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`}
              >
                <span aria-hidden="true" style={{ fontSize: 14 }}>
                  {item.is_magical ? '✦' : '⬡'}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: item.rarity !== 'common' ? itemRarityColor[item.rarity] : 'var(--ink-soft)',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    maxWidth: 62,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                  }}
                >
                  {item.name}
                </span>
                {item.quantity > 1 && (
                  <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 700 }}>×{item.quantity}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--muted)',
            fontStyle: 'italic',
            textAlign: 'center',
            padding: '20px 0',
          }}
        >
          Geen items in je inventaris.
        </p>
      )}
    </div>
  )
}
