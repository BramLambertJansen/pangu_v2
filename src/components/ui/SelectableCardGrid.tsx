import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface SelectableOption {
  id: string
  title: string
  tagline?: string
  /** Korte accentregel onder de tagline (bv. '+2 DEX +1 INT' of 'd8 · WIS'). */
  meta?: ReactNode
  glyph?: string
  /** CSS-achtergrond voor de banner (bv. uit pickGradient). */
  gradient?: string
  disabled?: boolean
}

export interface SelectableCardGridProps {
  /** Toegankelijke groepsnaam. */
  label: string
  options: SelectableOption[]
  /** Geselecteerde id('s); toggle-semantiek bepaalt de aanroeper in onSelect. */
  value: string | string[] | null
  onSelect: (id: string) => void
  /** Meerkeuze: kaarten worden toggle-buttons i.p.v. een radiogroup. */
  multiple?: boolean
  /** Zonder glyph-banner, compacter (bv. subklasses, achtergronden). */
  compact?: boolean
  className?: string
}

function isSelected(value: string | string[] | null, id: string): boolean {
  return Array.isArray(value) ? value.includes(id) : value === id
}

/**
 * "Kies één (of meer) uit grid"-kaarten. Enkelkeuze volgt het WAI-ARIA
 * radio-patroon (roving tabindex + pijltjes); meerkeuze gebruikt aria-pressed.
 */
export function SelectableCardGrid({
  label,
  options,
  value,
  onSelect,
  multiple = false,
  compact = false,
  className,
}: SelectableCardGridProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const moveFocus = (from: number, delta: number) => {
    let i = from
    for (let hops = 0; hops < options.length; hops++) {
      i = (i + delta + options.length) % options.length
      if (!options[i].disabled) break
    }
    refs.current[i]?.focus()
    if (!multiple) onSelect(options[i].id)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      moveFocus(index, 1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      moveFocus(index, -1)
    }
  }

  const anySelected = options.some((o) => isSelected(value, o.id))

  return (
    <div
      role={multiple ? 'group' : 'radiogroup'}
      aria-label={label}
      className={cn('option-grid', className)}
    >
      {options.map((option, i) => {
        const selected = isSelected(value, option.id)
        // roving tabindex: de selectie is tabbable, anders de eerste optie
        const tabIndex = multiple ? undefined : selected || (!anySelected && i === 0) ? 0 : -1
        return (
          <button
            key={option.id}
            ref={(el) => {
              refs.current[i] = el
            }}
            type="button"
            className={cn('option-card', compact && 'option-card--compact')}
            data-selected={selected}
            role={multiple ? undefined : 'radio'}
            aria-checked={multiple ? undefined : selected}
            aria-pressed={multiple ? selected : undefined}
            tabIndex={tabIndex}
            disabled={option.disabled}
            onClick={() => onSelect(option.id)}
            onKeyDown={multiple ? undefined : (e) => handleKeyDown(e, i)}
          >
            {!compact && (
              <span
                className="option-card-banner"
                style={option.gradient ? { background: option.gradient } : undefined}
              >
                <span className="option-card-glyph" aria-hidden="true">
                  {option.glyph ?? '✦'}
                </span>
                {selected && (
                  <span className="option-card-check" aria-hidden="true">
                    ✓
                  </span>
                )}
              </span>
            )}
            <span className="option-card-body">
              <span className="option-card-title">{option.title}</span>
              {option.tagline && <span className="option-card-tagline">{option.tagline}</span>}
              {option.meta && <span className="option-card-meta">{option.meta}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
