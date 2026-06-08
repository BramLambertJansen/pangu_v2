import { StubPanel } from '@/components/ui/StubPanel'

export interface SpellSlotsProps {
  /** Total slots per spell level (index 0 = level 1). */
  slots?: number[]
  /** Expended slots per spell level. */
  used?: number[]
  onToggle?: (level: number, index: number) => void
}

/** STUB — interactive spell-slot tracker with pip buttons and Roman-numeral levels. */
export function SpellSlots(_props: SpellSlotsProps) {
  return (
    <StubPanel
      title="Spreukslots"
      description="Interactieve spreukslot-tracker met pip-knoppen per niveau, Romeinse cijfers en gebruikt/resterend-tellers."
    />
  )
}
