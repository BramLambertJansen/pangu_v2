import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Profile } from '@/types/database.types'

interface Props {
  user: Profile | null
  loading: boolean
  onClose: () => void
  onConfirm: () => void
}

export function DeleteUserModal({ user, loading, onClose, onConfirm }: Props) {
  return (
    <ConfirmDialog
      open={user !== null}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Account verwijderen"
      confirmLabel="Verwijderen"
      loading={loading}
    >
      {user && (
        <>
          Weet je zeker dat je het account van{' '}
          <span className="font-medium" style={{ color: 'var(--ink)' }}>
            {user.display_name ?? user.email}
          </span>{' '}
          wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </>
      )}
    </ConfirmDialog>
  )
}
