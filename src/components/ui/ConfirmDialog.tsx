import type { ReactNode } from 'react'
import { Modal } from './Modal'

export interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  children: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'crimson' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  children,
  confirmLabel = 'Bevestigen',
  cancelLabel = 'Annuleren',
  confirmVariant = 'crimson',
  loading,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
        {children}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          className="pangu-btn pangu-btn-ghost"
          onClick={onClose}
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`pangu-btn pangu-btn-${confirmVariant}`}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? 'Bezig...' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
