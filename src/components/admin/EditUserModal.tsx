import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { getApiError } from '@/utils/apiError'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types/database.types'

interface Props {
  user: Profile | null
  onClose: () => void
}

interface FormState {
  display_name: string
  email: string
  password: string
}

async function updateUser(id: string, body: Partial<FormState>): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(`/api/admin/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await getApiError(res, 'Opslaan mislukt'))
  }
}

export function EditUserModal({ user, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>({ display_name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  useEffect(() => {
    if (user) {
      setForm({ display_name: user.display_name ?? '', email: user.email, password: '' })
      setErrors({})
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: () => {
      const body: Partial<FormState> = {}
      if (form.display_name !== (user!.display_name ?? '')) body.display_name = form.display_name
      if (form.email !== user!.email) body.email = form.email
      if (form.password) body.password = form.password
      return updateUser(user!.id, body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      toast.success('Account bijgewerkt')
      onClose()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  function handleClose() {
    setErrors({})
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!form.display_name.trim()) newErrors.display_name = 'Naam is verplicht'
    if (!form.email.trim()) newErrors.email = 'E-mailadres is verplicht'
    if (form.password && form.password.length < 8) {
      newErrors.password = 'Wachtwoord moet minimaal 8 tekens bevatten'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    mutation.mutate()
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    }
  }

  const hasChanges =
    form.display_name !== (user?.display_name ?? '') ||
    form.email !== (user?.email ?? '') ||
    form.password.length > 0

  return (
    <Modal open={user !== null} onClose={handleClose} title="Account bewerken">
      {user && (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <Input
            label="Naam"
            type="text"
            autoComplete="name"
            error={errors.display_name}
            {...field('display_name')}
          />
          <Input
            label="E-mailadres"
            type="email"
            autoComplete="off"
            error={errors.email}
            {...field('email')}
          />
          <Input
            label="Nieuw wachtwoord"
            type="password"
            autoComplete="new-password"
            placeholder="Laat leeg om niet te wijzigen"
            error={errors.password}
            {...field('password')}
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={handleClose}>
              Annuleren
            </Button>
            <Button type="submit" loading={mutation.isPending} disabled={!hasChanges}>
              Opslaan
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
