import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useAuthStore } from '@/stores/auth.store'
import type { Character, CharacterStatus } from '@/types/character.types'
import type { Campaign } from '@/types/campaign.types'

const statusOptions: { value: CharacterStatus; label: string }[] = [
  { value: 'active',   label: 'Actief'         },
  { value: 'inactive', label: 'Inactief'        },
  { value: 'retired',  label: 'Teruggetrokken' },
  { value: 'archived', label: 'Gearchiveerd'   },
]

interface NumericFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

function NumericField({ id, label, value, onChange, min = 0, max }: NumericFieldProps) {
  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="pangu-input"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(n)
        }}
      />
    </div>
  )
}

export default function CharacterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore(s => s.user)

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const classId = useId()
  const subclassId = useId()
  const raceId = useId()
  const subtitleId = useId()
  const campaignSelectId = useId()

  const locationState = location.state as { isNew?: boolean } | null
  const isNew = locationState?.isNew ?? false

  const { data: characterData, isLoading } = useQuery<Character>({
    queryKey: queryKeys.characters.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Character
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm,
  } = useEntityEdit({ entity: characterData, isNew })

  // Load user's campaigns for the campaign selector
  const { data: userCampaigns } = useQuery<Pick<Campaign, 'id' | 'name'>[]>({
    queryKey: [...queryKeys.campaigns.all, 'names'],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name', { ascending: true })
      if (error) throw error
      return data as Pick<Campaign, 'id' | 'name'>[]
    },
    enabled: !!user,
    staleTime: 1000 * 60,
  })

  const saveCharacter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('characters')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          character_class: form.character_class ?? null,
          character_subclass: form.character_subclass ?? null,
          character_race: form.character_race ?? null,
          campaign_id: form.campaign_id ?? null,
          level: form.level,
          xp: form.xp,
          xp_next: form.xp_next,
          hp_current: form.hp_current,
          hp_max: form.hp_max,
          armor_class: form.armor_class,
          speed: form.speed,
          initiative: form.initiative,
          proficiency_bonus: form.proficiency_bonus,
          stat_str: form.stat_str,
          stat_dex: form.stat_dex,
          stat_con: form.stat_con,
          stat_int: form.stat_int,
          stat_wis: form.stat_wis,
          stat_cha: form.stat_cha,
          gold: form.gold,
          silver: form.silver,
          copper: form.copper,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id!) })
      // Invalidate campaign character views for both old and new campaign
      queryClient.invalidateQueries({ queryKey: ['characters', 'campaign'] })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteCharacter = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('characters').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.characters.detail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all })
      navigate('/characters')
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function handleBack() {
    if (!committed) {
      navigate('/characters')
    } else {
      navigate(`/characters/${id}`)
    }
  }

  function handleCancel() {
    if (!committed) {
      navigate('/characters')
    } else {
      resetForm()
      navigate(`/characters/${id}`)
    }
  }

  function handleSave() {
    toast.promise(saveCharacter.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Karakter opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteCharacter.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Karakter verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Karakter laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!characterData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Karakter niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/characters')} style={{ marginTop: 16 }}>
          ← Terug naar karakters
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>

        {/* Back link */}
        <button
          type="button"
          onClick={handleBack}
          aria-label="Terug naar karakter"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            marginBottom: 24, padding: 0,
            transition: 'color var(--t-fast)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ink-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Terug naar karakter
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Karakter bewerken</p>
          <h1 className="pangu-display-xl">{characterData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details en stats van je personage aan.
          </p>
        </header>

        {/* ── Basisinfo ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Basisinfo</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor="char-name">Naam</label>
              <input
                id="char-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van je personage"
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={subtitleId}>Subtitel</label>
              <input
                id={subtitleId}
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Bijnaam of tagline"
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'active'}
                onChange={(e) => set('status', e.target.value as CharacterStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="pangu-label" htmlFor={campaignSelectId}>Kroniek</label>
              <select
                id={campaignSelectId}
                className="pangu-select"
                value={form.campaign_id ?? ''}
                onChange={(e) => set('campaign_id', e.target.value || null)}
              >
                <option value="">Geen kroniek</option>
                {userCampaigns?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Karakter ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Karakter</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="pangu-label" htmlFor={classId}>Klasse</label>
              <input
                id={classId}
                className="pangu-input"
                value={form.character_class ?? ''}
                onChange={(e) => set('character_class', e.target.value || null)}
                placeholder="Bijv. Barbaar, Magiër, Schurk..."
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={subclassId}>Subklasse</label>
              <input
                id={subclassId}
                className="pangu-input"
                value={form.character_subclass ?? ''}
                onChange={(e) => set('character_subclass', e.target.value || null)}
                placeholder="Bijv. Razernijpad, Waarzegger..."
              />
            </div>
            <div>
              <label className="pangu-label" htmlFor={raceId}>Ras</label>
              <input
                id={raceId}
                className="pangu-input"
                value={form.character_race ?? ''}
                onChange={(e) => set('character_race', e.target.value || null)}
                placeholder="Bijv. Mens, Elf, Dwerg..."
              />
            </div>
            <NumericField
              id="char-level"
              label="Level"
              value={form.level ?? 1}
              onChange={(v) => set('level', Math.min(20, Math.max(1, v)))}
              min={1}
              max={20}
            />
          </div>
        </div>

        {/* ── Ervaring ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Ervaring</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumericField
              id="char-xp"
              label="Huidige XP"
              value={form.xp ?? 0}
              onChange={(v) => set('xp', Math.max(0, v))}
            />
            <NumericField
              id="char-xp-next"
              label="Volgende level (XP)"
              value={form.xp_next ?? 300}
              onChange={(v) => set('xp_next', Math.max(1, v))}
              min={1}
            />
          </div>
        </div>

        {/* ── Gevechtsstats ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Gevechtsstats</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <NumericField
              id="char-hp-current"
              label="Huidige HP"
              value={form.hp_current ?? 10}
              onChange={(v) => set('hp_current', Math.max(0, v))}
            />
            <NumericField
              id="char-hp-max"
              label="Max HP"
              value={form.hp_max ?? 10}
              onChange={(v) => set('hp_max', Math.max(1, v))}
              min={1}
            />
            <NumericField
              id="char-ac"
              label="Wapenrusting (AC)"
              value={form.armor_class ?? 10}
              onChange={(v) => set('armor_class', Math.max(1, v))}
              min={1}
            />
            <NumericField
              id="char-speed"
              label="Snelheid (ft)"
              value={form.speed ?? 30}
              onChange={(v) => set('speed', Math.max(0, v))}
            />
            <NumericField
              id="char-initiative"
              label="Initiatief"
              value={form.initiative ?? 0}
              onChange={(v) => set('initiative', v)}
              min={-10}
              max={20}
            />
            <NumericField
              id="char-proficiency"
              label="Vaardigheidsbonus"
              value={form.proficiency_bonus ?? 2}
              onChange={(v) => set('proficiency_bonus', Math.max(0, v))}
            />
          </div>
        </div>

        {/* ── Eigenschappen ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Eigenschappen</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumericField id="char-str" label="Sterkte (STR)" value={form.stat_str ?? 10} onChange={(v) => set('stat_str', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-dex" label="Behendigheid (DEX)" value={form.stat_dex ?? 10} onChange={(v) => set('stat_dex', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-con" label="Constitutie (CON)" value={form.stat_con ?? 10} onChange={(v) => set('stat_con', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-int" label="Intelligentie (INT)" value={form.stat_int ?? 10} onChange={(v) => set('stat_int', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-wis" label="Wijsheid (WIS)" value={form.stat_wis ?? 10} onChange={(v) => set('stat_wis', Math.min(30, Math.max(1, v)))} min={1} max={30} />
            <NumericField id="char-cha" label="Charisma (CHA)" value={form.stat_cha ?? 10} onChange={(v) => set('stat_cha', Math.min(30, Math.max(1, v)))} min={1} max={30} />
          </div>
        </div>

        {/* ── Schatkist ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Schatkist</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumericField id="char-gold" label="Goud" value={form.gold ?? 0} onChange={(v) => set('gold', Math.max(0, v))} />
            <NumericField id="char-silver" label="Zilver" value={form.silver ?? 0} onChange={(v) => set('silver', Math.max(0, v))} />
            <NumericField id="char-copper" label="Koper" value={form.copper ?? 0} onChange={(v) => set('copper', Math.max(0, v))} />
          </div>
        </div>

        {/* ── Achtergrond ── */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 16 }}>Achtergrond</p>
          <div>
            <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
            <textarea
              id={descriptionId}
              className="pangu-textarea"
              value={form.description ?? ''}
              onChange={(e) => set('description', e.target.value || null)}
              placeholder="Achtergrondverhaal, uiterlijk en persoonlijkheid van je personage..."
              rows={4}
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="pangu-label" htmlFor={notesId}>Privénotities</label>
            <textarea
              id={notesId}
              className="pangu-textarea"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              placeholder="Persoonlijke aantekeningen, geheimen en doelen van je personage..."
              rows={8}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </button>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              onClick={handleSave}
              disabled={!dirty || saveCharacter.isPending}
            >
              {saveCharacter.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginBottom: 32, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Karakter verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het karakter permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder karakter
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Karakter verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{characterData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteCharacter.isPending}>
            {deleteCharacter.isPending ? 'Verwijderen...' : 'Verwijder karakter'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
