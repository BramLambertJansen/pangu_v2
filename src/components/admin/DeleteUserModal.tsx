import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types/database.types'

interface Props {
  user: Profile | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteUserModal({ user, loading, onClose, onConfirm }: Props) {
  return (
    <Modal open={user !== null} onClose={onClose} title="Account verwijderen">
      {user && (
        <div className="flex flex-col gap-6">
          <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
            Weet je zeker dat je het account van{' '}
            <span className="font-medium" style={{ color: 'var(--ink)' }}>
              {user.display_name ?? user.email}
            </span>{' '}
            wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Annuleren
            </Button>
            <Button type="button" variant="danger" loading={loading} onClick={onConfirm}>
              Verwijderen
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
