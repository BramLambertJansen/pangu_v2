import { StubPanel } from '@/components/ui/StubPanel'
import type { EquipmentSlot } from '@/types/item.types'

export interface SanctumInventoryProps {
  characterId: string
  /** Items currently equipped, keyed by slot. */
  equipped?: Partial<Record<EquipmentSlot, { id: string; name: string }>>
  onEquip?: (itemId: string, slot: EquipmentSlot) => void
  onUnequip?: (slot: EquipmentSlot) => void
}

/** STUB — paper-doll equipment silhouette + backpack grid with rarity glows. */
export function SanctumInventory(_props: SanctumInventoryProps) {
  return (
    <StubPanel
      title="Sanctum Inventaris"
      description="Paper-doll silhouet met uitrustingsslots gecombineerd met een rugzak-grid; items uitrusten/afleggen met rariteitsgloed."
    />
  )
}
