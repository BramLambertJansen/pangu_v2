import { Button } from '@/components/ui/Button'
import { cn } from '@/utils/cn'

export interface WizardNavBarProps {
  /** Weglaten verbergt de terug-knop (eerste stap). */
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  backLabel?: string
  canNext: boolean
  /** NL-melding waarom doorgaan nog niet kan; getoond naast de knoppen. */
  hint?: string
  nextLoading?: boolean
  className?: string
}

/** Terug/Doorgaan-balk onder een wizard-stap, met live blokkeer-melding. */
export function WizardNavBar({
  onBack,
  onNext,
  nextLabel = 'Doorgaan →',
  backLabel = '← Terug',
  canNext,
  hint,
  nextLoading,
  className,
}: WizardNavBarProps) {
  return (
    <div className={cn('wizard-navbar', className)}>
      {onBack ? (
        <Button variant="ghost" onClick={onBack}>
          {backLabel}
        </Button>
      ) : (
        <span aria-hidden="true" />
      )}
      <div className="flex min-w-0 items-center gap-4">
        <span className="wizard-nav-hint" role="status">
          {!canNext && hint ? hint : ''}
        </span>
        <Button variant="primary" onClick={onNext} disabled={!canNext} loading={nextLoading}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}
