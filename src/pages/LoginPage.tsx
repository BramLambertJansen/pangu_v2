import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setUser = useAuthStore((s) => s.setUser)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('E-mailadres of wachtwoord is onjuist.')
      toast.error('Inloggen mislukt')
      setLoading(false)
      return
    }

    setUser(data.user)
    navigate('/dashboard')
  }

  return (
    <section>
      <header style={{ marginBottom: 'var(--sp-8)' }}>
        <h1 className="title" style={{ marginBottom: 'var(--sp-2)' }}>Inloggen</h1>
        <p className="body">Ga verder waar je was gebleven.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        noValidate
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
      >
        {error && (
          <div
            role="alert"
            className="text-sm rounded-md"
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button type="submit" loading={loading} size="lg" className="w-full mt-2">
          Inloggen
        </Button>
      </form>

      <p className="small" style={{ textAlign: 'center', marginTop: 'var(--sp-6)' }}>
        Nog geen account?{' '}
        <Link
          to="/register"
          style={{ color: 'var(--violet)', textDecoration: 'none', fontWeight: 500 }}
        >
          Maak een account aan
        </Link>
      </p>
    </section>
  )
}
