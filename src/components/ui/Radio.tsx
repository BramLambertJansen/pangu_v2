import { createContext, useContext, useId, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

type RadioContextValue = {
  name: string
  value: string | null
  onChange: (next: string) => void
  disabled?: boolean
}

const RadioContext = createContext<RadioContextValue | null>(null)

export interface RadioGroupProps {
  /** Currently selected value. */
  value: string | null
  onChange: (next: string) => void
  /** HTML name attribute base for the group (auto-generated when omitted). */
  name?: string
  /** Accessible label for the whole group. */
  label?: string
  description?: string
  orientation?: 'vertical' | 'horizontal'
  disabled?: boolean
  children: ReactNode
  className?: string
}

export function RadioGroup({
  value,
  onChange,
  name,
  label,
  description,
  orientation = 'vertical',
  disabled,
  children,
  className,
}: RadioGroupProps) {
  const generated = useId()
  const groupName = name ?? `radio-${generated}`
  const labelId = `${groupName}-label`

  return (
    <RadioContext.Provider value={{ name: groupName, value, onChange, disabled }}>
      <div
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-disabled={disabled || undefined}
      >
        {label && (
          <div className="mb-2">
            <p id={labelId} className="label">{label}</p>
            {description && <p className="text-[11px] text-muted mt-0.5">{description}</p>}
          </div>
        )}
        <div
          className={cn('radio-group', className)}
          data-orientation={orientation}
        >
          {children}
        </div>
      </div>
    </RadioContext.Provider>
  )
}

export interface RadioProps {
  value: string
  label: string
  description?: string
  disabled?: boolean
  className?: string
}

export function Radio({ value, label, description, disabled, className }: RadioProps) {
  const ctx = useContext(RadioContext)
  if (!ctx) throw new Error('Radio must be rendered inside a <RadioGroup>')

  const isSelected = ctx.value === value
  const isDisabled = disabled || ctx.disabled

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-disabled={isDisabled || undefined}
      disabled={isDisabled}
      name={ctx.name}
      onClick={() => !isDisabled && ctx.onChange(value)}
      className={cn('radio-row', className)}
    >
      <span className="radio-dot">
        <span className="radio-inner" />
      </span>
      <span className="radio-body">
        <span className="radio-label">{label}</span>
        {description && <span className="radio-sub">{description}</span>}
      </span>
    </button>
  )
}
