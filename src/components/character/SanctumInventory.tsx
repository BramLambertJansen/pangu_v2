import type { CSSProperties } from 'react'
import { EQUIPMENT_SLOT_LABELS, EQUIPMENT_SLOT_ICONS } from '@/utils/equipmentUtils'
import { itemRarityRgb } from '@/lib/statusMaps'
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
  { slot: 'main_hand', column: 'left' },
  { slot: 'gloves', column: 'left' },
  { slot: 'ring1', column: 'left' },
  { slot: 'head', column: 'center' },
  { slot: 'neck', column: 'center' },
  { slot: 'chest', column: 'center' },
  { slot: 'boots', column: 'center' },
  { slot: 'off_hand', column: 'right' },
  { slot: 'cloak', column: 'right' },
  { slot: 'ring2', column: 'right' },
]

// Rarity colour is passed to CSS as a channel token; it is meaning-driven data.
function rarityVar(rarity: Item['rarity']): CSSProperties {
  return { '--rarity-rgb': itemRarityRgb[rarity] } as CSSProperties
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
  const icon = EQUIPMENT_SLOT_ICONS[slot]
  const clickable = !!item && !!onUnequip

  return (
    <div
      className="sanctum-slot"
      data-equipped={!!item}
      data-rare={!!item && item.rarity !== 'common'}
      style={item ? rarityVar(item.rarity) : undefined}
      title={item ? `${item.name} (${label})` : label}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
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
      <span aria-hidden="true" className="sanctum-slot-icon" data-empty={!item}>
        {icon}
      </span>
      {item ? (
        <>
          <span className="sanctum-slot-name">{item.name}</span>
          {item.is_magical && (
            <span aria-hidden="true" className="sanctum-slot-magic">
              ✦
            </span>
          )}
        </>
      ) : (
        <span className="sanctum-slot-empty">{label}</span>
      )}
    </div>
  )
}

/** Paper-doll equipment silhouette with 10 slots + backpack grid. */
export function SanctumInventory({ items = [], onUnequip, className }: SanctumInventoryProps) {
  const equippedMap: Partial<Record<EquipmentSlot, Item>> = {}
  for (const item of items) {
    if (item.equipped_slot) equippedMap[item.equipped_slot] = item
  }

  const backpackItems = items.filter((i) => !i.equipped_slot)
  const columns: Array<['left' | 'center' | 'right', string]> = [
    ['left', 'sanctum-col'],
    ['center', 'sanctum-col sanctum-col--center'],
    ['right', 'sanctum-col'],
  ]

  return (
    <div className={className}>
      <div className="sanctum-doll" aria-label="Uitrustingsslots">
        {columns.map(([column, cls]) => (
          <div key={column} className={cls}>
            {SLOT_LAYOUT.filter((s) => s.column === column).map(({ slot }) => (
              <SlotCell key={slot} slot={slot} item={equippedMap[slot]} onUnequip={onUnequip} />
            ))}
          </div>
        ))}
      </div>

      {backpackItems.length > 0 && (
        <div className="sanctum-backpack">
          <p className="sanctum-backpack-title">Rugzak ({backpackItems.length})</p>
          <div className="sanctum-backpack-grid" aria-label="Rugzakitems">
            {backpackItems.map((item) => {
              const rare = item.rarity !== 'common'
              return (
                <div
                  key={item.id}
                  className="sanctum-backpack-item"
                  data-rare={rare}
                  style={rare ? rarityVar(item.rarity) : undefined}
                  title={item.name}
                  aria-label={`${item.name}${item.quantity > 1 ? ` ×${item.quantity}` : ''}`}
                >
                  <span aria-hidden="true" className="sanctum-backpack-icon">
                    {item.is_magical ? '✦' : '⬡'}
                  </span>
                  <span className="sanctum-backpack-name">{item.name}</span>
                  {item.quantity > 1 && <span className="sanctum-backpack-qty">×{item.quantity}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {items.length === 0 && <p className="sanctum-empty">Geen items in je inventaris.</p>}
    </div>
  )
}
