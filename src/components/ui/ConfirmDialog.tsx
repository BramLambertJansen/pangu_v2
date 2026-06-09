import type { ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

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
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={confirmVariant === 'crimson' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {loading ? 'Bezig...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
        {children}
      </div>
    </Modal>
  )
}
