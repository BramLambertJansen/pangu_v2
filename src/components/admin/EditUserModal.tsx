import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils/apiError'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import type { Profile, ProfileRole } from '@/types/database.types'

interface Props {
  user: Profile | null
  onClose: () => void
}

async function updateUser(id: string, role: ProfileRole): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    throw new Error(await getApiError(res, 'Opslaan mislukt'))
  }
}

export function EditUserModal({ user, onClose }: Props) {
  const queryClient = useQueryClient()
  const [role, setRole] = useState<ProfileRole>('user')

  useEffect(() => {
    if (user) setRole(user.role)
  }, [user])

  const mutation = useMutation({
    mutationFn: () => updateUser(user!.id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      toast.success('Account bijgewerkt')
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    mutation.mutate()
  }

  return (
    <Modal open={user !== null} onClose={onClose} title="Account bewerken">
      {user && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-gray-400">
              Account van <span className="font-medium text-gray-200">{user.display_name ?? user.email}</span>
            </p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{user.email}</p>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="edit-role-select" className="text-sm font-medium text-gray-200">
              Rol
            </label>
            <select
              id="edit-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as ProfileRole)}
              className="h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <option value="user">Gebruiker</option>
              <option value="admin">Beheerder</option>
            </select>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuleren
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={role === user.role}>
              Opslaan
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
