import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export interface WizardShellStep {
  id: string
  label: string
}

export interface WizardShellProps {
  steps: WizardShellStep[]
  activeIndex: number
  /** Hoogste stap-index die via de stepper aanklikbaar is. */
  maxReachableIndex: number
  onStepSelect: (index: number) => void
  /** Inhoud van de actieve stap. */
  children: ReactNode
  /** Live samenvattingspaneel: vast rechts op desktop, uitklapbaar op mobiel. */
  aside?: ReactNode
  asideLabel?: string
  className?: string
}

/**
 * Generiek meerstaps-frame: stepper-rail op desktop, compacte voortgangsheader
 * op mobiel/tablet, optioneel zijpaneel. Stap-state en validatie blijven bij de
 * aanroeper; de shell rendert alleen navigatiestructuur (nav + aria-current).
 */
export function WizardShell({
  steps,
  activeIndex,
  maxReachableIndex,
  onStepSelect,
  children,
  aside,
  asideLabel = 'Samenvatting',
  className,
}: WizardShellProps) {
  const active = steps[activeIndex]

  return (
    <div className={cn('wizard-layout', className)}>
      <nav className="wizard-rail" aria-label="Stappen">
        <ol className="wizard-rail-steps">
          {steps.map((step, i) => {
            const state = i === activeIndex ? 'active' : i < activeIndex ? 'done' : 'todo'
            return (
              <li key={step.id}>
                <button
                  type="button"
                  className="wizard-rail-step"
                  data-state={state}
                  aria-current={i === activeIndex ? 'step' : undefined}
                  disabled={i > maxReachableIndex}
                  onClick={() => onStepSelect(i)}
                >
                  <span className="wizard-rail-dot" aria-hidden="true">
                    {state === 'done' ? '✓' : i + 1}
                  </span>
                  <span className="wizard-rail-label">{step.label}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <div className="min-w-0">
        <div className="wizard-progress mb-4" role="status">
          <div className="wizard-progress-text">
            <span className="wizard-progress-count">
              Stap {activeIndex + 1}/{steps.length}
            </span>
            <span className="wizard-progress-label">{active?.label}</span>
          </div>
          <div className="wizard-progress-bar">
            <div
              className="wizard-progress-fill"
              style={{ width: `${((activeIndex + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {aside && (
          <details className="wizard-aside-mobile mb-4">
            <summary>{asideLabel}</summary>
            <div className="mt-3">{aside}</div>
          </details>
        )}

        {children}
      </div>

      {aside && (
        <aside className="wizard-aside" aria-label={asideLabel}>
          {aside}
        </aside>
      )}
    </div>
  )
}
