import { useState, useId } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { usePreferencesStore, type PreferencesLanguage } from '@/stores/preferences.store'

type Tab = 'profile' | 'prefs' | 'about'

interface ProfileForm {
  display_name: string
  pronouns: string
  bio: string
}

// ── Compass rose SVG ─────────────────────────────────────

function CompassRose({ size = 80, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      style={{ opacity }}
    >
      <circle cx="40" cy="40" r="38" stroke="var(--violet)" strokeWidth="0.75" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="24" stroke="var(--violet)" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="40" cy="40" r="4" fill="var(--violet)" fillOpacity="0.8" />
      {/* N */}
      <polygon points="40,2 44,30 40,26 36,30" fill="var(--violet)" />
      {/* S */}
      <polygon points="40,78 44,50 40,54 36,50" fill="var(--ink-soft)" fillOpacity="0.5" />
      {/* E */}
      <polygon points="78,40 50,36 54,40 50,44" fill="var(--ink-soft)" fillOpacity="0.5" />
      {/* W */}
      <polygon points="2,40 30,44 26,40 30,36" fill="var(--ink-soft)" fillOpacity="0.5" />
      {/* NE */}
      <polygon points="67,13 48,36 44,32 57,23" fill="var(--gold)" fillOpacity="0.4" />
      {/* SW */}
      <polygon points="13,67 32,44 36,48 23,57" fill="var(--gold)" fillOpacity="0.2" />
      {/* NW */}
      <polygon points="13,13 32,36 28,32 23,23" fill="var(--gold)" fillOpacity="0.2" />
      {/* SE */}
      <polygon points="67,67 48,44 52,48 57,57" fill="var(--gold)" fillOpacity="0.2" />
      {/* tick marks */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 40 + 34 * Math.sin(rad)
        const y1 = 40 - 34 * Math.cos(rad)
        const x2 = 40 + 37 * Math.sin(rad)
        const y2 = 40 - 37 * Math.cos(rad)
        return (
          <line
            key={deg}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--violet)"
            strokeWidth="0.75"
            strokeOpacity="0.35"
          />
        )
      })}
    </svg>
  )
}

// ── SettingToggle ─────────────────────────────────────────

function SettingToggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string
  desc: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()
  return (
    <div className="flex items-center justify-between gap-6 py-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <label
          htmlFor={id}
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--ink-soft)' }}
        >
          {label}
        </label>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</span>
      </div>
      <button
        role="switch"
        id={id}
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="pangu-toggle"
        type="button"
      >
        <span className="pangu-toggle-knob" />
      </button>
    </div>
  )
}

// ── Profile tab ───────────────────────────────────────────

function ProfielTab() {
  const { profile, setProfile } = useAuthStore()

  const [form, setForm] = useState<ProfileForm>({
    display_name: profile?.display_name ?? '',
    pronouns: profile?.pronouns ?? '',
    bio: profile?.bio ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})

  const hasChanges =
    form.display_name !== (profile?.display_name ?? '') ||
    form.pronouns !== (profile?.pronouns ?? '') ||
    form.bio !== (profile?.bio ?? '')

  const initials = (profile?.display_name ?? profile?.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const bioId = useId()

  const mutation = useMutation({
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

  function handleCancel() {
    setForm({
      display_name: profile?.display_name ?? '',
      pronouns: profile?.pronouns ?? '',
      bio: profile?.bio ?? '',
    })
    setErrors({})
  }

  return (
    <div className="pangu-surface" style={{ padding: 28 }}>
      {/* Avatar row */}
      <div className="flex items-center gap-5" style={{ marginBottom: 32 }}>
        <div className="settings-avatar" aria-hidden="true">{initials}</div>
        <div>
          <h3 className="pangu-display" style={{ fontSize: 20 }}>
            {profile?.display_name ?? '—'}
          </h3>
          <p className="mt-1" style={{ fontSize: 13, color: 'var(--muted)' }}>
            Lid sinds ster-jaar {new Date(profile?.created_at ?? '').getFullYear()}
          </p>
          <button className="pangu-btn pangu-btn-violet-soft pangu-btn-sm mt-3" type="button">
            Foto wijzigen
          </button>
        </div>
      </div>

      {/* Form grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label
            className="pangu-label"
            htmlFor="settings-display-name"
          >
            Weergavenaam
          </label>
          <input
            id="settings-display-name"
            className="pangu-input"
            value={form.display_name}
            onChange={(e) => {
              setForm((f) => ({ ...f, display_name: e.target.value }))
              if (errors.display_name) setErrors((e) => ({ ...e, display_name: undefined }))
            }}
            autoComplete="name"
            aria-describedby={errors.display_name ? 'settings-display-name-error' : undefined}
            aria-invalid={errors.display_name ? true : undefined}
          />
          {errors.display_name && (
            <p id="settings-display-name-error" role="alert" style={{ fontSize: 12, color: 'var(--crimson)', marginTop: 4 }}>
              {errors.display_name}
            </p>
          )}
        </div>
        <div>
          <label className="pangu-label" htmlFor="settings-pronouns">
            Voornaamwoorden
          </label>
          <input
            id="settings-pronouns"
            className="pangu-input"
            value={form.pronouns}
            onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value }))}
            placeholder="bijv. zij/haar"
            autoComplete="off"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="pangu-label" htmlFor="settings-email">
            E-mailadres
          </label>
          <input
            id="settings-email"
            className="pangu-input"
            value={profile?.email ?? ''}
            disabled
            aria-readonly="true"
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label className="pangu-label" htmlFor={bioId}>
            Bio
          </label>
          <textarea
            id={bioId}
            className="pangu-textarea"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Een zachte hand aan het stuur. Een zwaar duim op de dobbelstenen."
            rows={4}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-end gap-3" style={{ marginTop: 24 }}>
        <button
          type="button"
          className="pangu-btn pangu-btn-ghost"
          onClick={handleCancel}
          disabled={!hasChanges}
        >
          Annuleren
        </button>
        <button
          type="button"
          className="pangu-btn pangu-btn-primary"
          onClick={() => mutation.mutate()}
          disabled={!hasChanges || mutation.isPending}
        >
          {mutation.isPending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  )
}

// ── Preferences tab ───────────────────────────────────────

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
    { value: 'en', label: 'English' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="pangu-surface" style={{ padding: 24 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>Meldingen</p>
        <SettingToggle
          label="Sessieherinneringen"
          desc="Herinner me voor mijn volgende sessie."
          checked={sessionReminders}
          onChange={(v) => setPreference('sessionReminders', v)}
        />
        <SettingToggle
          label="Geluidseffecten"
          desc="Rollende dobbelstenen, kaarsvlam, etc."
          checked={soundEffects}
          onChange={(v) => setPreference('soundEffects', v)}
        />
        <div style={{ borderBottom: 'none' }}>
          <SettingToggle
            label="Aantekeningen automatisch opslaan"
            desc="Sla sessielogboeken elke 30 seconden op."
            checked={autosaveNotes}
            onChange={(v) => setPreference('autosaveNotes', v)}
          />
        </div>
      </div>
      <div className="pangu-surface" style={{ padding: 24 }}>
        <p className="pangu-section-title" style={{ marginBottom: 4 }}>AI</p>
        <SettingToggle
          label="Lore-suggesties"
          desc="Laat de kosmos ideeën fluisteren in de kantlijn."
          checked={loreSuggestions}
          onChange={(v) => setPreference('loreSuggestions', v)}
        />
        <div style={{ paddingTop: 16, marginTop: 4 }}>
          <label className="pangu-label" htmlFor={langId}>Taal</label>
          <select
            id={langId}
            className="pangu-select"
            value={language}
            onChange={(e) => setPreference('language', e.target.value as PreferencesLanguage)}
          >
            {languages.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

// ── About tab ─────────────────────────────────────────────

function OverTab() {
  return (
    <div className="pangu-surface-glow flex flex-col items-center" style={{ padding: 32, textAlign: 'center' }}>
      <CompassRose size={80} opacity={0.7} />
      <h2 className="pangu-display-lg" style={{ marginTop: 24 }}>PANGU</h2>
      <p className="pangu-eyebrow" style={{ marginTop: 8, justifyContent: 'center' }}>
        SANCTUM EDITION · II
      </p>
      <p
        className="pangu-quote"
        style={{ maxWidth: 480, margin: '24px auto 0' }}
      >
        "Gebouwd voor Dungeon Masters die liever verhalen vertellen dan bijhouden."
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          maxWidth: 480,
          width: '100%',
          margin: '32px auto 0',
          paddingTop: 24,
          borderTop: '1px solid var(--hairline)',
        }}
      >
        {[
          { label: 'Versie', value: 'v2.0', color: 'var(--violet)' },
          { label: 'Status', value: 'BETA', color: 'var(--gold)' },
          { label: 'Licentie', value: 'MIT', color: 'var(--ink-soft)' },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {label}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color,
                marginTop: 4,
                fontSize: 14,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings page ─────────────────────────────────────────

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'prefs', label: 'Preferences' },
    { id: 'about', label: 'About' },
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><div style={{ maxWidth: 820, width: '100%' }}>
      {/* Page header */}
      <header style={{ marginBottom: 40 }}>
        <p className="pangu-eyebrow">Configuration</p>
        <h1 className="pangu-display-xl">Settings</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Tune the Sanctum to your liking.
        </p>
      </header>

      {/* Tab bar */}
      <nav aria-label="Instellingen tabbladen" style={{ maxWidth: 400, marginBottom: 32 }}>
        <div role="tablist" className="pangu-tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
              className="pangu-tab"
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
        {activeTab === 'profile' && <ProfielTab />}
        {activeTab === 'prefs' && <VoorkeurenTab />}
        {activeTab === 'about' && <OverTab />}
      </div>
    </div></div>
  )
}
