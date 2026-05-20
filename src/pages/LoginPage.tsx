import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types/database.types'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setUser, setProfile } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: typeof errors = {}
    if (!email.trim()) newErrors.email = 'E-mailadres is verplicht'
    if (!password) newErrors.password = 'Wachtwoord is verplicht'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error('Inloggen mislukt: ' + error.message)
      setLoading(false)
      return
    }

    setUser(data.user)

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profile) setProfile(profile as Profile)

    navigate(profile?.role === 'admin' ? '/admin' : '/dashboard', { replace: true })
  }

  return (
    <section aria-labelledby="login-heading">
      <h1
        id="login-heading"
        className="mb-6 text-xl font-semibold"
        style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
      >
        Inloggen
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="E-mailadres"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
          placeholder="jouw@email.nl"
        />
        <Input
          label="Wachtwoord"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Inloggen
        </Button>
      </form>
    </section>
  )
}
