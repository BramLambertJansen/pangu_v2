import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface Props {
  open: boolean
  onClose: () => void
}

interface FormState {
  display_name: string
  email: string
  password: string
}

async function createUser(body: FormState): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token ?? ''}`,
    },
    body: JSON.stringify({ ...body, role: 'user' }),
  })
  if (!res.ok) {
    const json = await res.json() as { error?: string }
    throw new Error(json.error ?? 'Account aanmaken mislukt')
  }
}

export function CreateUserModal({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>({ display_name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users })
      toast.success('Account aangemaakt')
      handleClose()
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  function handleClose() {
    setForm({ display_name: '', email: '', password: '' })
    setErrors({})
    onClose()
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: typeof errors = {}
    if (!form.display_name.trim()) newErrors.display_name = 'Naam is verplicht'
    if (!form.email.trim()) newErrors.email = 'E-mailadres is verplicht'
    if (!form.password) newErrors.password = 'Wachtwoord is verplicht'
    if (form.password.length > 0 && form.password.length < 8) {
      newErrors.password = 'Wachtwoord moet minimaal 8 tekens bevatten'
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setErrors({})
    mutation.mutate(form)
  }

  function field(key: keyof FormState) {
    return {
      value: form[key],
      onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [key]: e.target.value })),
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nieuw account aanmaken">
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
          label="Wachtwoord"
          type="password"
          autoComplete="new-password"
          error={errors.password}
          {...field('password')}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Annuleren
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            Account aanmaken
          </Button>
        </div>
      </form>
    </Modal>
  )
}
