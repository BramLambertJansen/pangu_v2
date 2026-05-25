import { useState, useId, useRef } from 'react'
import { CompassRose } from '@/components/world/CompassRose'
import { Spinner } from '@/components/ui/Spinner'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { usePreferencesStore, type PreferencesLanguage } from '@/stores/preferences.store'

type Tab = 'profile' | 'prefs' | 'ai' | 'about'

interface ProfileForm {
  display_name: string
  pronouns: string
  bio: string
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
  const labelId = `${id}-label`
  return (
    <div className="flex items-center justify-between gap-6 py-4" style={{ borderBottom: '1px solid var(--hairline)' }}>
      <div className="flex flex-col gap-0.5 min-w-0">
        <label
          id={labelId}
          className="text-sm font-medium cursor-pointer"
          style={{ color: 'var(--ink-soft)' }}
        >
          {label}
        </label>
        <span className="text-xs" style={{ color: 'var(--muted)' }}>{desc}</span>
      </div>
      <button
        role="switch"
        aria-labelledby={labelId}
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

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5 MB

function ProfielTab() {
  const profile = useAuthStore(s => s.profile)
  const setProfile = useAuthStore(s => s.setProfile)

  const [form, setForm] = useState<ProfileForm>({
    display_name: profile?.display_name ?? '',
    pronouns: profile?.pronouns ?? '',
    bio: profile?.bio ?? '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileForm, string>>>({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  async function handleAvatarUpload(file: File) {
    if (!profile) return
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error('Afbeelding mag maximaal 5 MB zijn')
      return
    }
    setAvatarUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${profile.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const avatarUrl = urlData.publicUrl
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', profile.id)
      if (updateError) throw updateError
      setProfile({ ...profile, avatar_url: avatarUrl })
      toast.success('Foto bijgewerkt')
    } catch {
      toast.error('Uploaden mislukt')
    } finally {
      setAvatarUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error('no_profile')
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
        .eq('id', profile.id)
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
      if (err.message !== 'validation' && err.message !== 'no_profile') toast.error('Opslaan mislukt')
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
      {/* Hidden file input for avatar upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleAvatarUpload(file)
          e.target.value = ''
        }}
      />

      {/* Avatar row */}
      <div className="flex items-center gap-5" style={{ marginBottom: 32 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name ?? 'Avatar'}
              className="settings-avatar"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="settings-avatar" aria-hidden="true">{initials}</div>
          )}
          {avatarUploading && (
            <div
              className="absolute inset-0 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(0,0,0,0.45)' }}
              aria-live="polite"
              aria-label="Foto wordt geüpload"
            >
              <Spinner size="sm" />
            </div>
          )}
        </div>
        <div>
          <h3 className="pangu-display" style={{ fontSize: 20 }}>
            {profile?.display_name ?? '—'}
          </h3>
          <p className="mt-1" style={{ fontSize: 13, color: 'var(--muted)' }}>
            Lid sinds ster-jaar {new Date(profile?.created_at ?? '').getFullYear()}
          </p>
          <button
            className="pangu-btn pangu-btn-violet-soft pangu-btn-sm mt-3"
            type="button"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUploading ? 'Uploaden...' : 'Foto wijzigen'}
          </button>
        </div>
      </div>

      {/* Form grid */}
      <div className="settings-form-grid">
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
        <div className="span-2" style={{ gridColumn: 'span 2' }}>
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
        <div className="span-2" style={{ gridColumn: 'span 2' }}>
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
  const sessionReminders = usePreferencesStore(s => s.sessionReminders)
  const soundEffects = usePreferencesStore(s => s.soundEffects)
  const autosaveNotes = usePreferencesStore(s => s.autosaveNotes)
  const loreSuggestions = usePreferencesStore(s => s.loreSuggestions)
  const language = usePreferencesStore(s => s.language)
  const setPreference = usePreferencesStore(s => s.setPreference)

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

// ── AI keys tab ──────────────────────────────────────

interface ProviderKeyCardProps {
  title: string
  description: string
  isSet: boolean
  fieldId: string
  onSave: (key: string) => void
  onClear: () => void
  isSavePending: boolean
  isClearPending: boolean
}

function ProviderKeyCard({
  title,
  description,
  isSet,
  fieldId,
  onSave,
  onClear,
  isSavePending,
  isClearPending,
}: ProviderKeyCardProps) {
  const [keyInput, setKeyInput] = useState('')
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="pangu-surface" style={{ padding: 24 }}>
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: 20 }}>
        <div>
          <p className="pangu-section-title" style={{ marginBottom: 2 }}>{title}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>{description}</p>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 10px',
            borderRadius: 'var(--r-full)',
            background: isSet ? 'color-mix(in srgb, var(--teal) 15%, transparent)' : 'color-mix(in srgb, var(--muted) 12%, transparent)',
            color: isSet ? 'var(--teal)' : 'var(--muted)',
            border: `1px solid ${isSet ? 'color-mix(in srgb, var(--teal) 30%, transparent)' : 'var(--hairline)'}`,
          }}
          aria-label={isSet ? 'Sleutel ingesteld' : 'Sleutel niet ingesteld'}
        >
          {isSet ? 'Ingesteld' : 'Niet ingesteld'}
        </span>
      </div>

      <div>
        <label className="pangu-label" htmlFor={fieldId}>
          API-sleutel
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={fieldId}
            type={showKey ? 'text' : 'password'}
            className="pangu-input"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={isSet ? '••••••••  (voer een nieuwe sleutel in om te vervangen)' : 'sk-...'}
            autoComplete="off"
            spellCheck={false}
            style={{ paddingRight: 44 }}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            aria-label={showKey ? 'Sleutel verbergen' : 'Sleutel tonen'}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: 0,
              lineHeight: 0,
            }}
          >
            {showKey ? (
              // eye-off icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              // eye icon
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3" style={{ marginTop: 16 }}>
        {isSet && (
          <button
            type="button"
            className="pangu-btn pangu-btn-ghost"
            onClick={onClear}
            disabled={isClearPending || isSavePending}
          >
            {isClearPending ? 'Wissen...' : 'Wissen'}
          </button>
        )}
        <button
          type="button"
          className="pangu-btn pangu-btn-primary"
          onClick={() => {
            if (keyInput.trim()) onSave(keyInput.trim())
          }}
          disabled={!keyInput.trim() || isSavePending || isClearPending}
        >
          {isSavePending ? 'Opslaan...' : 'Opslaan'}
        </button>
      </div>
    </div>
  )
}

function AISleutelsTab() {
  const profile = useAuthStore(s => s.profile)
  const setProfile = useAuthStore(s => s.setProfile)

  const openaiMutation = useMutation({
    mutationFn: async (key: string | null) => {
      if (!profile) throw new Error('no_profile')
      const { data, error } = await supabase
        .from('profiles')
        .update({ openai_api_key: key })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setProfile({ ...profile!, ...data })
      toast.success(data.openai_api_key ? 'OpenAI-sleutel opgeslagen' : 'OpenAI-sleutel gewist')
    },
    onError: () => toast.error('Opslaan mislukt'),
  })

  const anthropicMutation = useMutation({
    mutationFn: async (key: string | null) => {
      if (!profile) throw new Error('no_profile')
      const { data, error } = await supabase
        .from('profiles')
        .update({ anthropic_api_key: key })
        .eq('id', profile.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      setProfile({ ...profile!, ...data })
      toast.success(data.anthropic_api_key ? 'Anthropic-sleutel opgeslagen' : 'Anthropic-sleutel gewist')
    },
    onError: () => toast.error('Opslaan mislukt'),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Info callout */}
      <div
        className="pangu-surface"
        style={{
          padding: '16px 20px',
          borderLeft: '3px solid var(--violet)',
          background: 'color-mix(in srgb, var(--violet) 6%, var(--surface))',
        }}
      >
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--ink)' }}>Eigen AI-sleutels (BYOK)</strong> — Gebruik je eigen API-sleutels voor AI-functies in het Sanctum.
          Sleutels worden per account opgeslagen en zijn uitsluitend voor jou zichtbaar.
          Ze worden nooit gedeeld of gebruikt buiten jouw sessies.
        </p>
      </div>

      <ProviderKeyCard
        title="OpenAI"
        description="GPT-4o en andere OpenAI-modellen voor lore-generatie."
        isSet={profile?.openai_api_key != null}
        fieldId="ai-openai-key"
        onSave={(key) => openaiMutation.mutate(key)}
        onClear={() => openaiMutation.mutate(null)}
        isSavePending={openaiMutation.isPending && openaiMutation.variables !== null}
        isClearPending={openaiMutation.isPending && openaiMutation.variables === null}
      />

      <ProviderKeyCard
        title="Anthropic (Claude)"
        description="Claude Sonnet en Opus voor consistente verhaalintelligentie."
        isSet={profile?.anthropic_api_key != null}
        fieldId="ai-anthropic-key"
        onSave={(key) => anthropicMutation.mutate(key)}
        onClear={() => anthropicMutation.mutate(null)}
        isSavePending={anthropicMutation.isPending && anthropicMutation.variables !== null}
        isClearPending={anthropicMutation.isPending && anthropicMutation.variables === null}
      />
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
        className="about-stats-grid"
        style={{
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
    { id: 'profile', label: 'Profiel' },
    { id: 'prefs', label: 'Voorkeuren' },
    { id: 'ai', label: 'AI' },
    { id: 'about', label: 'Over' },
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><div style={{ maxWidth: 820, width: '100%' }}>
      {/* Page header */}
      <header style={{ marginBottom: 40 }}>
        <p className="pangu-eyebrow">Configuratie</p>
        <h1 className="pangu-display-xl">Instellingen</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Pas het Sanctum aan naar jouw wensen.
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
        {activeTab === 'ai' && <AISleutelsTab />}
        {activeTab === 'about' && <OverTab />}
      </div>
    </div></div>
  )
}
