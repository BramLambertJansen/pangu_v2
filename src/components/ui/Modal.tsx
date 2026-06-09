import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/utils/cn'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Optional sticky footer for action buttons (e.g. Cancel + Confirm). */
  footer?: ReactNode
  size?: ModalSize
  className?: string
}

const sizeClass: Record<ModalSize, string> = {
  sm: 'modal-sm',
  md: '',
  lg: 'modal-lg',
  xl: 'modal-xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()

  useEffect(() => { onCloseRef.current = onClose }, [onClose])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement
    dialogRef.current?.focus()

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') { onCloseRef.current(); return }
      if (e.key !== 'Tab') return

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-50"
      onClick={(e) => { if (e.target === e.currentTarget) onCloseRef.current() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn('modal', sizeClass[size], className)}
      >
        <div className="modal-head">
          <h2 id={titleId} className="modal-head-title">{title}</h2>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Sluiten"
            className="modal-close"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
