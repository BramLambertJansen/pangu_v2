import { cn } from '@/utils/cn'

export interface NumberStepperProps {
  value: number
  onChange: (next: number) => void
  /** Accessible name of what is being stepped, e.g. "HP" or "Ki-punten". */
  label: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
}

/** − value + cluster for inline numeric tweaks (HP, class resources). */
export function NumberStepper({
  value,
  onChange,
  label,
  min,
  max,
  step = 1,
  disabled,
  className,
}: NumberStepperProps) {
  const atMin = min !== undefined && value <= min
  const atMax = max !== undefined && value >= max
  return (
    <div className={cn('number-stepper', className)}>
      <button
        type="button"
        className="hp-step"
        onClick={() => onChange(min !== undefined ? Math.max(min, value - step) : value - step)}
        disabled={disabled || atMin}
        aria-label={`${label} verlagen`}
      >
        −
      </button>
      <span className="number-stepper-value" aria-live="polite" aria-label={label}>
        {value}
      </span>
      <button
        type="button"
        className="hp-step"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + step) : value + step)}
        disabled={disabled || atMax}
        aria-label={`${label} verhogen`}
      >
        +
      </button>
    </div>
  )
}
