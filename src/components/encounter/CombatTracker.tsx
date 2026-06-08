import { StubPanel } from '@/components/ui/StubPanel'

export interface Combatant {
  id: string
  name: string
  initiative: number
  hp: number
  maxHp: number
}

export interface CombatTrackerProps {
  encounterId: string
  combatants?: Combatant[]
  /** Index of the combatant whose turn it currently is. */
  activeIndex?: number
  onNextTurn?: () => void
  onHpChange?: (id: string, delta: number) => void
}

/** STUB — initiative-wheel combat widget (sorted order, current-turn highlight, HP steppers). */
export function CombatTracker(_props: CombatTrackerProps) {
  return (
    <StubPanel
      title="Gevechtstracker"
      description="Initiatiefwiel met deelnemers op volgorde, huidige-beurt-markering, HP-steppers en 'Volgende beurt'. Bouwt voort op EncounterRunPage."
    />
  )
}
