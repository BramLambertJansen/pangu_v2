import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import type { Profile } from '@/types/database.types'

interface FormErrors {
  displayName?: string
  email?: string
  password?: string
  confirmPassword?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore(s => s.setUser)
  const setProfile = useAuthStore(s => s.setProfile)

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (!displayName.trim()) errs.displayName = 'Naam is verplicht'
    if (!email.trim()) errs.email = 'E-mailadres is verplicht'
    if (!password) errs.password = 'Wachtwoord is verplicht'
    else if (password.length < 8) errs.password = 'Wachtwoord moet minimaal 8 tekens bevatten'
    if (!confirmPassword) errs.confirmPassword = 'Bevestig je wachtwoord'
    else if (password !== confirmPassword) errs.confirmPassword = 'Wachtwoorden komen niet overeen'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setLoading(true)
    setErrors({})

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (error) {
      toast.error('Registratie mislukt. Probeer het opnieuw.')
      setLoading(false)
      return
    }

    // Email confirmation required — user exists but is not yet confirmed
    if (!data.session) {
      toast.success('Account aangemaakt! Controleer je e-mail om te bevestigen.')
      navigate('/login', { replace: true })
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single()

    if (profile) setProfile(profile as Profile)
    setUser(data.user!)

    toast.success('Welkom bij PANGU!')
    navigate('/dashboard', { replace: true })
  }

  return (
    <section aria-labelledby="register-heading">
      <h1
        id="register-heading"
        className="mb-6 text-xl font-semibold"
        style={{ color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
      >
        Account aanmaken
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Naam"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          error={errors.displayName}
          autoComplete="name"
          placeholder="Jouw naam"
        />
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
          autoComplete="new-password"
          placeholder="Minimaal 8 tekens"
        />
        <Input
          label="Wachtwoord bevestigen"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          placeholder="••••••••"
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Account aanmaken
        </Button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
        Al een account?{' '}
        <Link
          to="/login"
          className="font-medium underline-offset-4 hover:underline"
          style={{ color: 'var(--violet)' }}
        >
          Inloggen
        </Link>
      </p>
    </section>
  )
}
