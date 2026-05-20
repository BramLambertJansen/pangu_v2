import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { EditUserModal } from './EditUserModal'
import type { Profile } from '@/types/database.types'

async function fetchUsers(): Promise<Profile[]> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin/users', {
    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
  })
  if (!res.ok) throw new Error('Ophalen van accounts mislukt')
  return res.json() as Promise<Profile[]>
}

async function deleteUser(id: string): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${session?.access_token ?? ''}` },
  })
  if (!res.ok) {
    const json = await res.json() as { error?: string }
    throw new Error(json.error ?? 'Verwijderen mislukt')
  }
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('nl-NL', { dateStyle: 'medium' }).format(new Date(iso))
}

function getInitials(profile: Profile) {
  if (profile.display_name) {
    return profile.display_name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
  }
  return profile.email[0].toUpperCase()
}

export function UserTable() {
  const queryClient = useQueryClient()
  const [editTarget, setEditTarget] = useState<Profile | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data: users, isLoading, isError } = useQuery({
    queryKey: queryKeys.admin.users,
    queryFn: fetchUsers,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      toast.success('Account verwijderd')
      setDeletingId(null)
    },
    onError: (err: Error) => {
      toast.error(err.message)
      setDeletingId(null)
    },
  })

  function handleDeleteClick(user: Profile) {
    if (!window.confirm(`Account van "${user.display_name ?? user.email}" verwijderen?`)) return
    setDeletingId(user.id)
    deleteMutation.mutate(user.id)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16" aria-live="polite" aria-label="Accounts laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        Accounts konden niet worden geladen.
      </p>
    )
  }

  if (!users?.length) {
    return (
      <p className="py-8 text-center text-sm" style={{ color: 'var(--muted)' }}>
        Geen accounts gevonden.
      </p>
    )
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--hairline)' }}>
        <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--hairline)', background: 'var(--surface)' }}>
              {['Gebruiker', 'E-mail', 'Rol', 'Aangemaakt', ''].map((col) => (
                <th
                  key={col}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: 'var(--muted)' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user, idx) => (
              <tr
                key={user.id}
                style={{
                  borderBottom: idx < users.length - 1 ? '1px solid var(--hairline)' : undefined,
                  background: 'var(--surface)',
                }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar fallback={getInitials(user)} size="sm" aria-hidden="true" />
                    <span style={{ color: 'var(--ink)' }}>{user.display_name ?? '—'}</span>
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--ink-soft)' }}>
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === 'admin' ? 'info' : 'default'}>
                    {user.role === 'admin' ? 'Beheerder' : 'Gebruiker'}
                  </Badge>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditTarget(user)}
                      aria-label={`Account van ${user.display_name ?? user.email} bewerken`}
                    >
                      Bewerken
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingId === user.id}
                      onClick={() => handleDeleteClick(user)}
                      aria-label={`Account van ${user.display_name ?? user.email} verwijderen`}
                    >
                      Verwijderen
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EditUserModal user={editTarget} onClose={() => setEditTarget(null)} />
    </>
  )
}
