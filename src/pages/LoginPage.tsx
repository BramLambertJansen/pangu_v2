import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { DEV_MODE } from '@/lib/constants'
import { sanitizeRedirectPath } from '@/utils/sanitizeUrl'
import type { Profile } from '@/types/database.types'

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const setUser = useAuthStore(s => s.setUser)
  const setProfile = useAuthStore(s => s.setProfile)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      toast.error('Inloggen mislukt. Controleer je e-mailadres en wachtwoord.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profile) setProfile(profile as Profile)

    setUser(data.user)

    const defaultRedirect = profile?.role === 'admin' ? '/admin' : '/dashboard'
    const redirectTo = sanitizeRedirectPath(searchParams.get('redirect'), defaultRedirect)
    navigate(redirectTo, { replace: true })
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
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          placeholder="••••••••"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              aria-label={showPassword ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
              className="flex h-6 w-6 items-center justify-center rounded text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />
        <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
          Inloggen
        </Button>
      </form>

      {!DEV_MODE && (
        <p className="mt-6 text-center text-sm" style={{ color: 'var(--ink-soft)' }}>
          Nog geen account?{' '}
          <Link
            to="/register"
            className="font-medium underline-offset-4 hover:underline"
            style={{ color: 'var(--violet)' }}
          >
            Account aanmaken
          </Link>
        </p>
      )}
    </section>
  )
}
