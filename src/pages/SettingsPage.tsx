import { useState, useId } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { usePreferencesStore, type PreferencesLanguage } from '@/stores/preferences.store'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { cn } from '@/utils/cn'

type Tab = 'profiel' | 'voorkeuren' | 'over'

interface ProfileForm {
  display_name: string
  pronouns: string
  bio: string
}

interface PasswordForm {
  newPassword: string
  confirmPassword: string
}

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean
  onChange: (val: boolean) => void
  id: string
}) {
  return (
    <button
      role="switch"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950',
        checked ? 'bg-indigo-600' : 'bg-gray-700',
      )}
      type="button"
    >
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (val: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="text-sm text-gray-200 cursor-pointer select-none">
        {label}
      </label>
      <Toggle id={id} checked={checked} onChange={onChange} />
    </div>
  )
}

function ProfielTab() {
  const { profile, setProfile } = useAuthStore()
  const navigate = useNavigate()

  const [form, setForm] = useState<ProfileForm>({
    display_name: profile?.display_name ?? '',
    pronouns: profile?.pronouns ?? '',
    bio: profile?.bio ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    newPassword: '',
    confirmPassword: '',
  })
  const [passwordErrors, setPasswordErrors] = useState<Partial<Record<keyof PasswordForm, string>>>({})
  const [showPassword, setShowPassword] = useState(false)

  const field = (key: keyof ProfileForm) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
    },
  })

  const profileMutation = useMutation({
    mutationFn: async () => {
      const newErrors: Partial<Record<keyof ProfileForm, string>> = {}
      if (!form.display_name.trim()) newErrors.display_name = 'Weergavenaam is verplicht'
      if (Object.keys(newErrors).length) {
        setErrors(newErrors)
        throw new Error('validation')
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          display_name: form.display_name.trim(),
          pronouns: form.pronouns.trim() || null,
          bio: form.bio.trim() || null,
        })
        .eq('id', profile!.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setProfile({ ...profile!, ...data })
      toast.success('Profiel opgeslagen')
    },
    onError: (err: Error) => {
      if (err.message !== 'validation') toast.error('Opslaan mislukt')
    },
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const newErrors: Partial<Record<keyof PasswordForm, string>> = {}
      if (passwordForm.newPassword.length < 8)
        newErrors.newPassword = 'Minimaal 8 tekens'
      if (passwordForm.newPassword !== passwordForm.confirmPassword)
        newErrors.confirmPassword = 'Wachtwoorden komen niet overeen'
      if (Object.keys(newErrors).length) {
        setPasswordErrors(newErrors)
        throw new Error('validation')
      }

      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword })
      if (error) throw error
    },
    onSuccess: () => {
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      toast.success('Wachtwoord gewijzigd')
      setShowPassword(false)
    },
    onError: (err: Error) => {
      if (err.message !== 'validation') toast.error('Wachtwoord wijzigen mislukt')
    },
  })

  async function handleSignOut() {
    await supabase.auth.signOut()
    useAuthStore.getState().signOut()
    toast.success('Uitgelogd')
    navigate('/login', { replace: true })
  }

  const initials = (profile?.display_name ?? profile?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const bioId = useId()

  return (
    <div className="space-y-6">
      {/* Avatar row */}
      <div className="flex items-center gap-4">
        <Avatar size="lg" fallback={initials} alt={profile?.display_name ?? 'Gebruiker'} />
        <div>
          <p className="text-base font-semibold text-gray-100">
            {profile?.display_name ?? '—'}
          </p>
          <p className="text-xs text-gray-400">
            Lid sinds {new Date(profile?.created_at ?? '').getFullYear()}
          </p>
        </div>
      </div>

      {/* Profile form */}
      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Accountgegevens
        </h2>
        <Input
          label="Weergavenaam"
          value={form.display_name}
          onChange={field('display_name').onChange}
          error={errors.display_name}
          autoComplete="name"
        />
        <Input
          label="Voornaamwoorden"
          value={form.pronouns}
          onChange={field('pronouns').onChange}
          placeholder="bijv. zij/haar"
          autoComplete="off"
        />
        <Input
          label="E-mailadres"
          value={profile?.email ?? ''}
          disabled
          aria-readonly="true"
        />
        <div className="flex flex-col gap-1">
          <label htmlFor={bioId} className="text-sm font-medium text-gray-200">
            Bio
          </label>
          <textarea
            id={bioId}
            rows={3}
            value={form.bio}
            onChange={field('bio').onChange}
            placeholder="Vertel iets over jezelf..."
            className={cn(
              'w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100',
              'placeholder:text-gray-500 resize-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            )}
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              setForm({
                display_name: profile?.display_name ?? '',
                pronouns: profile?.pronouns ?? '',
                bio: profile?.bio ?? '',
              })
            }
          >
            Annuleren
          </Button>
          <Button
            variant="primary"
            loading={profileMutation.isPending}
            onClick={() => profileMutation.mutate()}
          >
            Opslaan
          </Button>
        </div>
      </Card>

      {/* Password change */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
            Wachtwoord wijzigen
          </h2>
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="text-xs text-indigo-400 hover:text-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
          >
            {showPassword ? 'Verbergen' : 'Wijzigen'}
          </button>
        </div>
        {showPassword && (
          <div className="space-y-4">
            <Input
              label="Nieuw wachtwoord"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => {
                setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                if (passwordErrors.newPassword)
                  setPasswordErrors((e) => ({ ...e, newPassword: undefined }))
              }}
              error={passwordErrors.newPassword}
              autoComplete="new-password"
            />
            <Input
              label="Bevestig wachtwoord"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => {
                setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                if (passwordErrors.confirmPassword)
                  setPasswordErrors((e) => ({ ...e, confirmPassword: undefined }))
              }}
              error={passwordErrors.confirmPassword}
              autoComplete="new-password"
            />
            <div className="flex justify-end">
              <Button
                variant="primary"
                loading={passwordMutation.isPending}
                onClick={() => passwordMutation.mutate()}
              >
                Wachtwoord opslaan
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          Sessie
        </h2>
        <Button variant="danger" onClick={handleSignOut} className="w-full sm:w-auto">
          Uitloggen
        </Button>
      </Card>
    </div>
  )
}

function VoorkeurenTab() {
  const {
    sessionReminders,
    soundEffects,
    autosaveNotes,
    loreSuggestions,
    language,
    setPreference,
  } = usePreferencesStore()

  const langId = useId()

  const languages: { value: PreferencesLanguage; label: string }[] = [
    { value: 'nl', label: 'Nederlands' },
    { value: 'en', label: 'English' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
  ]

  return (
    <div className="space-y-6">
      <Card className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Meldingen
        </h2>
        <div className="divide-y divide-gray-800">
          <ToggleRow
            label="Sessieherinneringen"
            checked={sessionReminders}
            onChange={(v) => setPreference('sessionReminders', v)}
          />
          <ToggleRow
            label="Geluidseffecten"
            checked={soundEffects}
            onChange={(v) => setPreference('soundEffects', v)}
          />
          <ToggleRow
            label="Aantekeningen automatisch opslaan"
            checked={autosaveNotes}
            onChange={(v) => setPreference('autosaveNotes', v)}
          />
        </div>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-400">
          AI-instellingen
        </h2>
        <div className="divide-y divide-gray-800">
          <ToggleRow
            label="Lore-suggesties"
            checked={loreSuggestions}
            onChange={(v) => setPreference('loreSuggestions', v)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={langId} className="text-sm font-medium text-gray-200">
            Taal
          </label>
          <select
            id={langId}
            value={language}
            onChange={(e) => setPreference('language', e.target.value as PreferencesLanguage)}
            className={cn(
              'h-10 rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-gray-100',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
            )}
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </Card>
    </div>
  )
}

function OverTab() {
  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm text-center space-y-6 py-8">
        {/* Compass rose icon */}
        <div className="flex justify-center">
          <svg
            aria-hidden="true"
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-indigo-400"
          >
            <circle cx="12" cy="12" r="10" />
            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
          </svg>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">
            SANCTUM EDITION · II
          </p>
          <h2 className="text-2xl font-bold tracking-widest text-gray-100">PANGU</h2>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed px-2">
          Een levende wereld voor verhalen die blijven. Bouw, verken en vertel met de hulp van een
          intelligente kampagneassistent.
        </p>
        <div className="grid grid-cols-3 gap-4 border-t border-gray-800 pt-6">
          {[
            { label: 'Versie', value: 'v2.0' },
            { label: 'Status', value: 'BETA' },
            { label: 'Licentie', value: 'MIT' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-1">
              <span className="text-xs text-gray-500 uppercase tracking-wider">{label}</span>
              <span className="text-sm font-semibold text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profiel')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profiel', label: 'Profiel' },
    { id: 'voorkeuren', label: 'Voorkeuren' },
    { id: 'over', label: 'Over' },
  ]

  return (
    <main className="mx-auto w-full max-w-[820px] px-4 py-8">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Instellingen</p>
        <h1 className="text-2xl font-bold text-gray-100">Jouw account</h1>
        <p className="mt-1 text-sm text-gray-400">Beheer je profiel en voorkeuren.</p>
      </header>

      {/* Tab navigation */}
      <nav aria-label="Instellingen tabbladen" className="mb-6">
        <div
          role="tablist"
          className="flex gap-1 border-b border-gray-800"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-t',
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-400 text-indigo-300'
                  : 'text-gray-400 hover:text-gray-200',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id={`tabpanel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTab === 'profiel' && <ProfielTab />}
        {activeTab === 'voorkeuren' && <VoorkeurenTab />}
        {activeTab === 'over' && <OverTab />}
      </div>
    </main>
  )
}
