import { useState, useId, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { CompassRose } from '@/components/world/CompassRose'
import { Spinner } from '@/components/ui/Spinner'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { FormField } from '@/components/ui/FormField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import {
  useThemeStore,
  THEMES,
  THEME_LABELS,
  ACCENTS,
  DENSITIES,
  type ThemeName,
  type ThemeAccent,
  type ThemeDensity,
} from '@/stores/theme.store'
import { UserTable } from '@/components/admin/UserTable'
import { CreateUserModal } from '@/components/admin/CreateUserModal'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { usePreferencesStore, type PreferencesLanguage } from '@/stores/preferences.store'
import { useUserAISettings, useSetByokKey } from '@/hooks/queries/useUserAISettings'
import { useUpdateProfile } from '@/hooks/queries/useProfile'
import { useAI } from '@/hooks/useAI'
import type { Provider } from '@/types/ai'

type Tab = 'profile' | 'prefs' | 'ai' | 'about' | 'pangu'

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
  return (
    <Toggle
      label={label}
      description={desc}
      checked={checked}
      onChange={onChange}
    />
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

  const updateProfile = useUpdateProfile()

  function handleCancel() {
    setForm({
      display_name: profile?.display_name ?? '',
      pronouns: profile?.pronouns ?? '',
      bio: profile?.bio ?? '',
    })
    setErrors({})
  }

  return (
    <div className="surface" style={{ padding: 28 }}>
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
          <h3 className="pg-display" style={{ fontSize: 20 }}>
            {profile?.display_name ?? '—'}
          </h3>
          <p className="mt-1" style={{ fontSize: 13, color: 'var(--muted)' }}>
            Lid sinds ster-jaar {new Date(profile?.created_at ?? '').getFullYear()}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-3"
            disabled={avatarUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUploading ? 'Uploaden...' : 'Foto wijzigen'}
          </Button>
        </div>
      </div>

      {/* Form grid */}
      <div className="settings-form-grid">
        <div>
          <label
            className="label"
            htmlFor="settings-display-name"
          >
            Weergavenaam
          </label>
          <input
            id="settings-display-name"
            className="input"
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
          <label className="label" htmlFor="settings-pronouns">
            Voornaamwoorden
          </label>
          <input
            id="settings-pronouns"
            className="input"
            value={form.pronouns}
            onChange={(e) => setForm((f) => ({ ...f, pronouns: e.target.value }))}
            placeholder="bijv. zij/haar"
            autoComplete="off"
          />
        </div>
        <div className="span-2" style={{ gridColumn: 'span 2' }}>
          <label className="label" htmlFor="settings-email">
            E-mailadres
          </label>
          <input
            id="settings-email"
            className="input"
            value={profile?.email ?? ''}
            disabled
            aria-readonly="true"
          />
        </div>
        <div className="span-2" style={{ gridColumn: 'span 2' }}>
          <label className="label" htmlFor={bioId}>
            Bio
          </label>
          <textarea
            id={bioId}
            className="textarea"
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Een zachte hand aan het stuur. Een zwaar duim op de dobbelstenen."
            rows={4}
          />
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center justify-end gap-3" style={{ marginTop: 24 }}>
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={!hasChanges}
        >
          Annuleren
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            const newErrors: Partial<Record<keyof ProfileForm, string>> = {}
            if (!form.display_name.trim()) newErrors.display_name = 'Weergavenaam is verplicht'
            if (Object.keys(newErrors).length) { setErrors(newErrors); return }
            setErrors({})
            updateProfile.mutate({ display_name: form.display_name, pronouns: form.pronouns, bio: form.bio })
          }}
          loading={updateProfile.isPending}
          disabled={!hasChanges}
        >
          Opslaan
        </Button>
      </div>
    </div>
  )
}

// ── Preferences tab ───────────────────────────────────────

const ACCENT_LABELS: Record<ThemeAccent, string> = {
  violet: 'Violet',
  teal: 'Teal',
  gold: 'Goud',
  azure: 'Azuur',
  crimson: 'Karmijn',
}

const DENSITY_LABELS: Record<ThemeDensity, string> = {
  standard: 'Standaard',
  cozy: 'Ruim',
  compact: 'Compact',
}

function VoorkeurenTab() {
  const sessionReminders = usePreferencesStore(s => s.sessionReminders)
  const soundEffects = usePreferencesStore(s => s.soundEffects)
  const autosaveNotes = usePreferencesStore(s => s.autosaveNotes)
  const loreSuggestions = usePreferencesStore(s => s.loreSuggestions)
  const language = usePreferencesStore(s => s.language)
  const setPreference = usePreferencesStore(s => s.setPreference)

  const { theme, accent, density, setTheme, setAccent, setDensity } = useThemeStore()

  const languages: { value: PreferencesLanguage; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'nl', label: 'Nederlands' },
    { value: 'de', label: 'Deutsch' },
    { value: 'fr', label: 'Français' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="surface" style={{ padding: 24 }}>
        <p className="pg-section-title" style={{ marginBottom: 12 }}>Weergave</p>
        <div className="flex flex-col gap-4">
          <FormField label="Thema">
            <SegmentedControl<ThemeName>
              label="Thema"
              value={theme}
              onChange={setTheme}
              options={THEMES.map((t) => ({ value: t, label: THEME_LABELS[t] }))}
            />
          </FormField>
          <FormField label="Accentkleur">
            <SegmentedControl<ThemeAccent>
              label="Accentkleur"
              value={accent}
              onChange={setAccent}
              options={ACCENTS.map((a) => ({ value: a, label: ACCENT_LABELS[a] }))}
            />
          </FormField>
          <FormField label="Densiteit">
            <SegmentedControl<ThemeDensity>
              label="Densiteit"
              value={density}
              onChange={setDensity}
              options={DENSITIES.map((d) => ({ value: d, label: DENSITY_LABELS[d] }))}
            />
          </FormField>
        </div>
      </div>
      <div className="surface" style={{ padding: 24 }}>
        <p className="pg-section-title" style={{ marginBottom: 4 }}>Meldingen</p>
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
      <div className="surface" style={{ padding: 24 }}>
        <p className="pg-section-title" style={{ marginBottom: 4 }}>AI</p>
        <SettingToggle
          label="Lore-suggesties"
          desc="Laat de kosmos ideeën fluisteren in de kantlijn."
          checked={loreSuggestions}
          onChange={(v) => setPreference('loreSuggestions', v)}
        />
        <div style={{ paddingTop: 16, marginTop: 4 }}>
          <Select
            label="Taal"
            value={language}
            onChange={(e) => setPreference('language', e.target.value as PreferencesLanguage)}
            options={languages}
          />
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
    <div className="surface" style={{ padding: 24 }}>
      <div className="flex items-start justify-between gap-4" style={{ marginBottom: 20 }}>
        <div>
          <p className="pg-section-title" style={{ marginBottom: 2 }}>{title}</p>
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
        <label className="label" htmlFor={fieldId}>
          API-sleutel
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id={fieldId}
            type={showKey ? 'text' : 'password'}
            className="input"
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
          <Button
            variant="ghost"
            onClick={onClear}
            loading={isClearPending}
            disabled={isSavePending}
          >
            Wissen
          </Button>
        )}
        <Button
          variant="primary"
          onClick={() => {
            if (keyInput.trim()) onSave(keyInput.trim())
          }}
          loading={isSavePending}
          disabled={!keyInput.trim() || isClearPending}
        >
          Opslaan
        </Button>
      </div>
    </div>
  )
}

function AISleutelsTab() {
  const profile = useAuthStore(s => s.profile)
  const { data: aiSettings } = useUserAISettings(profile?.id)
  const setByokKey = useSetByokKey(profile?.id)

  const byokKeys: Record<string, string> = (aiSettings?.byok_keys as Record<string, string>) ?? {}

  return (
    <div className="flex flex-col gap-4">
      {/* Info callout */}
      <div
        className="surface"
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
        isSet={'openai' in byokKeys}
        fieldId="ai-openai-key"
        onSave={(key) => {
          setByokKey.mutate(
            { provider: 'openai', key, currentKeys: byokKeys },
            {
              onSuccess: ({ key: saved }) =>
                toast.success(saved ? 'OpenAI-sleutel opgeslagen' : 'OpenAI-sleutel gewist'),
              onError: () => toast.error('Opslaan mislukt'),
            },
          )
        }}
        onClear={() => {
          setByokKey.mutate(
            { provider: 'openai', key: null, currentKeys: byokKeys },
            {
              onSuccess: () => toast.success('OpenAI-sleutel gewist'),
              onError: () => toast.error('Wissen mislukt'),
            },
          )
        }}
        isSavePending={
          setByokKey.isPending &&
          setByokKey.variables?.provider === 'openai' &&
          setByokKey.variables?.key !== null
        }
        isClearPending={
          setByokKey.isPending &&
          setByokKey.variables?.provider === 'openai' &&
          setByokKey.variables?.key === null
        }
      />

      <ProviderKeyCard
        title="Anthropic (Claude)"
        description="Claude Sonnet en Opus voor consistente verhaalintelligentie."
        isSet={'anthropic' in byokKeys}
        fieldId="ai-anthropic-key"
        onSave={(key) => {
          setByokKey.mutate(
            { provider: 'anthropic', key, currentKeys: byokKeys },
            {
              onSuccess: ({ key: saved }) =>
                toast.success(saved ? 'Anthropic-sleutel opgeslagen' : 'Anthropic-sleutel gewist'),
              onError: () => toast.error('Opslaan mislukt'),
            },
          )
        }}
        onClear={() => {
          setByokKey.mutate(
            { provider: 'anthropic', key: null, currentKeys: byokKeys },
            {
              onSuccess: () => toast.success('Anthropic-sleutel gewist'),
              onError: () => toast.error('Wissen mislukt'),
            },
          )
        }}
        isSavePending={
          setByokKey.isPending &&
          setByokKey.variables?.provider === 'anthropic' &&
          setByokKey.variables?.key !== null
        }
        isClearPending={
          setByokKey.isPending &&
          setByokKey.variables?.provider === 'anthropic' &&
          setByokKey.variables?.key === null
        }
      />
    </div>
  )
}

// ── About tab ─────────────────────────────────────────────

function OverTab() {
  return (
    <div className="surface-glow flex flex-col items-center" style={{ padding: 32, textAlign: 'center' }}>
      <CompassRose size={80} opacity={0.7} />
      <h2 className="pg-display-lg" style={{ marginTop: 24 }}>PANGU</h2>
      <p className="pg-eyebrow" style={{ marginTop: 8, justifyContent: 'center' }}>
        SANCTUM EDITION · II
      </p>
      <p
        className="pg-quote"
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

      {/* SRD Attribution */}
      <div
        style={{
          maxWidth: 480,
          width: '100%',
          margin: '24px auto 0',
          padding: '16px',
          borderRadius: 10,
          border: '1px solid var(--hairline)',
          background: 'rgb(var(--azure-rgb) / 0.05)',
          textAlign: 'left',
        }}
      >
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--azure)', margin: '0 0 8px' }}>
          Powered by Open5e · SRD-content
        </p>
        <p style={{ fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6, margin: 0 }}>
          Sommige content in PANGU is afkomstig van de{' '}
          <abbr title="Systems Reference Document 5.1">SRD 5.1</abbr>
          {' '}via <span style={{ color: 'var(--azure)' }}>Open5e</span>.
          Deze content is beschikbaar onder de{' '}
          <abbr title="Creative Commons Attribution 4.0 International">CC-BY-4.0</abbr>
          {' '}licentie.
          © Wizards of the Coast, gelicenseerd via de SRD 5.1.
        </p>
      </div>
    </div>
  )
}

// ── Pangu tab (admin-only) ────────────────────────────────

const PROVIDER_LABELS: Record<Provider, string> = {
  groq: 'Groq', gemini: 'Gemini', anthropic: 'Anthropic', openai: 'OpenAI',
}
const PROVIDER_COLORS: Record<Provider, string> = {
  groq: 'var(--teal)', gemini: 'var(--azure)', anthropic: 'var(--violet)', openai: 'var(--gold)',
}
interface AITestResult { reply: string; provider: Provider; model: string; windowRemaining: number | null }

function PanguTab() {
  const [createOpen, setCreateOpen] = useState(false)
  const [testResult, setTestResult] = useState<AITestResult | null>(null)
  const { ask, loading, lastProvider, lastModel, windowRemaining } = useAI()

  async function handleTestAI() {
    setTestResult(null)
    try {
      const reply = await ask([{ role: 'user', content: 'Reageer in het Nederlands. Zeg in één zin welke AI-provider en model je bent, en geef een kort D&D-gezegde.' }])
      if (lastProvider && lastModel) {
        setTestResult({ reply, provider: lastProvider, model: lastModel, windowRemaining })
      }
      toast.success('AI-test geslaagd')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI-test mislukt')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Accountbeheer section */}
      <div>
        <div className="flex items-center justify-between gap-4" style={{ marginBottom: 16 }}>
          <div>
            <p className="pg-section-title" style={{ marginBottom: 2 }}>Accountbeheer</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Overzicht en beheer van alle accounts</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="sm">
            Nieuw account
          </Button>
        </div>
        <UserTable />
        <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} />
      </div>

      {/* AI integration test section */}
      <div className="surface" style={{ padding: 24 }}>
        <div className="flex flex-wrap items-center justify-between gap-3" style={{ marginBottom: 16 }}>
          <div>
            <p className="pg-section-title" style={{ marginBottom: 2 }}>AI-integratie</p>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Test de cascaderende AI-providers (Groq → Gemini)</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={handleTestAI}
            aria-label="Test AI-verbinding"
          >
            {loading ? 'Bezig…' : 'Test Gemini / Groq'}
          </Button>
        </div>
        {testResult && (
          <div className="rounded-lg p-4 space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--hairline)' }} role="status" aria-live="polite">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${PROVIDER_COLORS[testResult.provider]} 15%, transparent)`, color: PROVIDER_COLORS[testResult.provider], border: `1px solid color-mix(in srgb, ${PROVIDER_COLORS[testResult.provider]} 35%, transparent)` }}>
                {PROVIDER_LABELS[testResult.provider]}
              </span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>{testResult.model}</span>
              {testResult.windowRemaining !== null && testResult.windowRemaining >= 0 && (
                <span className="ml-auto text-xs" style={{ color: 'var(--subtle)' }}>
                  {testResult.windowRemaining} verzoek{testResult.windowRemaining !== 1 ? 'en' : ''} resterend
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{testResult.reply}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Settings page ─────────────────────────────────────────

export default function SettingsPage() {
  const profile = useAuthStore(s => s.profile)
  const location = useLocation()
  const initialTab = (location.state as { tab?: Tab } | null)?.tab ?? 'profile'
  const [activeTab, setActiveTab] = useState<Tab>(initialTab)

  const tabs: { id: Tab; label: string; special?: boolean }[] = [
    { id: 'profile', label: 'Profiel' },
    { id: 'prefs', label: 'Voorkeuren' },
    { id: 'ai', label: 'AI' },
    { id: 'about', label: 'Over' },
    ...(profile?.role === 'admin' ? [{ id: 'pangu' as Tab, label: 'Pangu', special: true }] : []),
  ]

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}><div style={{ maxWidth: 820, width: '100%' }}>
      {/* Page header */}
      <header style={{ marginBottom: 40 }}>
        <p className="pg-eyebrow">Configuratie</p>
        <h1 className="pg-display-xl">Instellingen</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
          Pas het Sanctum aan naar jouw wensen.
        </p>
      </header>

      {/* Tab bar */}
      <nav aria-label="Instellingen tabbladen" style={{ marginBottom: 32 }}>
        <Tabs
          label="Instellingen tabbladen"
          value={activeTab}
          onValueChange={(id) => setActiveTab(id as Tab)}
          items={tabs.map((tab) => ({
            id: tab.id,
            label: tab.special ? (
              <span style={{ color: activeTab === tab.id ? 'var(--violet)' : 'color-mix(in srgb, var(--violet) 60%, var(--muted))' }}>
                <span aria-hidden="true" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--violet)', marginRight: 6, verticalAlign: 'middle', opacity: 0.8 }} />
                {tab.label}
              </span>
            ) : tab.label,
          }))}
        />
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
        {activeTab === 'pangu' && <PanguTab />}
      </div>
    </div></div>
  )
}
