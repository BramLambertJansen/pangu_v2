import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.')
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      setError(authError.message)
      toast.error('Registreren mislukt')
      setLoading(false)
      return
    }

    setUser(data.user)
    toast.success('Account aangemaakt! Controleer je e-mail om te bevestigen.')
    navigate('/dashboard')
  }

  return (
    <section>
      <header style={{ marginBottom: 'var(--sp-8)' }}>
        <h1 className="title" style={{ marginBottom: 'var(--sp-2)' }}>Account aanmaken</h1>
        <p className="body">Begin je reis als Dungeon Master.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
      >
        {error && (
          <div
            role="alert"
            className="text-sm"
            style={{
              padding: 'var(--sp-3) var(--sp-4)',
              background: 'rgba(255, 107, 107, 0.1)',
              border: '1px solid rgba(255, 107, 107, 0.3)',
              borderRadius: 'var(--r-md)',
              color: 'var(--crimson)',
            }}
          >
            {error}
          </div>
        )}

        <Input
          label="E-mailadres"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Wachtwoord"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          label="Wachtwoord bevestigen"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Account aanmaken
        </Button>
      </form>

      <p className="small" style={{ textAlign: 'center', marginTop: 'var(--sp-6)' }}>
        Al een account?{' '}
        <Link
          to="/login"
          style={{ color: 'var(--violet)', textDecoration: 'none', fontWeight: 500 }}
        >
          Inloggen
        </Link>
      </p>
    </section>
  )
}
