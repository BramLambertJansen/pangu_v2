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
  /** Merk/logo bovenaan de rail (en in de mobiele topbalk) in fullHeight-modus. */
  brand?: ReactNode
  /** Acties onderaan de rail (en in de mobiele topbalk), bv. annuleren/overslaan. */
  railFooter?: ReactNode
  /** Vastgepinde balk onder de scrollende content (bv. de navigatiebalk). */
  footer?: ReactNode
  /** Vult de viewport als gefocuste takeover (rail wordt de nav, content scrollt). */
  fullHeight?: boolean
  className?: string
}

/**
 * Generiek meerstaps-frame. Standaard: stepper-rail + content + zijpaneel in
 * de paginastroom. In `fullHeight`-modus neemt het de viewport over (rail wordt
 * de nav, content scrollt intern, navigatiebalk pint onderaan). Stap-state en
 * validatie blijven bij de aanroeper; de shell rendert alleen de structuur.
 */
export function WizardShell({
  steps,
  activeIndex,
  maxReachableIndex,
  onStepSelect,
  children,
  aside,
  asideLabel = 'Samenvatting',
  brand,
  railFooter,
  footer,
  fullHeight = false,
  className,
}: WizardShellProps) {
  const active = steps[activeIndex]

  const stepsNav = (
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
  )

  const progress = (
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
  )

  const mobileAside = aside && (
    <details className="wizard-aside-mobile mb-4">
      <summary>{asideLabel}</summary>
      <div className="mt-3">{aside}</div>
    </details>
  )

  if (fullHeight) {
    return (
      <div className={cn('wizard-shell-full', className)}>
        <nav className="wizard-rail" aria-label="Stappen">
          {brand && <div className="wizard-rail-brand">{brand}</div>}
          {stepsNav}
          {railFooter && <div className="wizard-rail-footer">{railFooter}</div>}
        </nav>

        <div className="wizard-main">
          {(brand || railFooter) && (
            <div className="wizard-topbar">
              <div className="wizard-topbar-brand">{brand}</div>
              {railFooter && <div className="wizard-topbar-actions">{railFooter}</div>}
            </div>
          )}
          <div className="wizard-content-scroll">
            <div className="wizard-content-inner">
              {progress}
              {mobileAside}
              {children}
            </div>
          </div>
          {footer && (
            <div className="wizard-content-footer">
              <div className="wizard-content-inner">{footer}</div>
            </div>
          )}
        </div>

        {aside && (
          <aside className="wizard-aside" aria-label={asideLabel}>
            {aside}
          </aside>
        )}
      </div>
    )
  }

  return (
    <div className={cn('wizard-layout', className)}>
      <nav className="wizard-rail" aria-label="Stappen">
        {stepsNav}
      </nav>

      <div className="min-w-0">
        {progress}
        {mobileAside}
        {children}
        {footer}
      </div>

      {aside && (
        <aside className="wizard-aside" aria-label={asideLabel}>
          {aside}
        </aside>
      )}
    </div>
  )
}
