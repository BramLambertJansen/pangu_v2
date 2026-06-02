import { useId, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useAuthStore } from '@/stores/auth.store'
import type { Bestiary, BestiaryStatus } from '@/types/bestiary.types'

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const statusOptions: { value: BestiaryStatus; label: string }[] = [
  { value: 'draft',    label: 'Concept'      },
  { value: 'active',   label: 'Actief'       },
  { value: 'archived', label: 'Gearchiveerd' },
]

interface NumericFieldProps {
  id: string
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
}

function NumericField({ id, label, value, onChange, min = 0 }: NumericFieldProps) {
  return (
    <div>
      <label className="pangu-label" htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        className="pangu-input"
        value={value}
        min={min}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(n)
        }}
      />
    </div>
  )
}

export default function BestiaryEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [imageUploading, setImageUploading] = useState(false)

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const creatureTypeId = useId()
  const threatLevelId = useId()
  const habitatId = useId()

  const locationState = location.state as { isNew?: boolean; worldId?: string } | null
  const isNew = locationState?.isNew ?? false
  const worldIdFromState = locationState?.worldId

  const { data: bestiaryData, isLoading } = useQuery<Bestiary>({
    queryKey: queryKeys.worlds.bestiaryDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestiaries')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Bestiary
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: bestiaryData, isNew })

  const worldId = bestiaryData?.world_id ?? worldIdFromState

  const saveBestiary = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('bestiaries')
        .update({
          name: form.name,
          subtitle: form.subtitle ?? null,
          creature_type: form.creature_type ?? null,
          threat_level: form.threat_level ?? null,
          habitat: form.habitat ?? null,
          description: form.description ?? null,
          notes: form.notes ?? null,
          status: form.status,
          hp: form.hp,
          ac: form.ac,
          speed: form.speed,
          stat_str: form.stat_str,
          stat_dex: form.stat_dex,
          stat_con: form.stat_con,
          stat_int: form.stat_int,
          stat_wis: form.stat_wis,
          stat_cha: form.stat_cha,
          image_url: form.image_url ?? null,
          committed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      if (worldId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id!) })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetailFull(id!) })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteBestiary = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('bestiaries').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id!) })
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetailFull(id!) })
      if (worldId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
        navigate(`/worlds/${worldId}/bestiary`)
      } else {
        navigate('/worlds')
      }
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      const { error } = await supabase.from('bestiaries').delete().eq('id', id!)
      if (error) { toast.error('Verwijderen mislukt'); return }
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id!) })
      queryClient.removeQueries({ queryKey: queryKeys.worlds.bestiaryDetailFull(id!) })
      if (worldId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaries(worldId) })
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (worldId) navigate(`/worlds/${worldId}/bestiary`)
      else navigate('/worlds')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (worldId) navigate(`/worlds/${worldId}/bestiary`)
      else navigate('/worlds')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (worldId) navigate(`/worlds/${worldId}/bestiary`)
      else navigate('/worlds')
    }
  }

  async function handleImageUpload(file: File) {
    if (!user || !id) return
    if (!file.type.startsWith('image/')) {
      toast.error('Alleen afbeeldingen zijn toegestaan')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Afbeelding mag maximaal 5 MB zijn')
      return
    }
    setImageUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `bestiaries/${user.id}/${id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('entity-images')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: urlData } = supabase.storage.from('entity-images').getPublicUrl(path)
      const imageUrl = urlData.publicUrl
      const { error: updateError } = await supabase
        .from('bestiaries')
        .update({ image_url: imageUrl })
        .eq('id', id)
      if (updateError) throw updateError
      set('image_url', imageUrl)
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id) })
      toast.success('Afbeelding opgeslagen')
    } catch {
      toast.error('Uploaden mislukt')
    } finally {
      setImageUploading(false)
    }
  }

  async function handleImageRemove() {
    if (!id) return
    const { error } = await supabase
      .from('bestiaries')
      .update({ image_url: null })
      .eq('id', id)
    if (error) { toast.error('Verwijderen mislukt'); return }
    set('image_url', null)
    queryClient.invalidateQueries({ queryKey: queryKeys.worlds.bestiaryDetail(id) })
    toast.success('Afbeelding verwijderd')
  }

  function handleSave() {
    toast.promise(saveBestiary.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Wezen opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteBestiary.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Wezen verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Wezen laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!bestiaryData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Wezen niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/worlds')} style={{ marginTop: 16 }}>
          ← Terug naar werelden
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
          aria-label="Terug naar bestiarium"
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
          Terug naar bestiarium
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Wezen bewerken</p>
          <h1 className="pangu-display-xl">{bestiaryData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van dit wezen aan.
          </p>
        </header>

        {/* Afbeelding */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Afbeelding</p>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, marginTop: 0 }}>
            Voeg een illustratie toe van dit wezen. Maximaal 5 MB.
          </p>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleImageUpload(file)
              e.target.value = ''
            }}
          />
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {form.image_url ? (
                <img
                  src={form.image_url}
                  alt={`Afbeelding van ${form.name ?? 'wezen'}`}
                  style={{
                    width: 140, height: 140, objectFit: 'cover',
                    borderRadius: 12,
                    border: '1px solid var(--hairline)',
                    display: 'block',
                  }}
                />
              ) : (
                <div
                  aria-hidden="true"
                  style={{
                    width: 140, height: 140, borderRadius: 12,
                    border: '1px dashed var(--hairline)',
                    background: 'var(--surface-2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexDirection: 'column', gap: 6,
                  }}
                >
                  <svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span style={{ fontSize: 11, color: 'var(--subtle)', fontFamily: 'var(--font-body)' }}>Geen afbeelding</span>
                </div>
              )}
              {imageUploading && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 12 }}
                  aria-live="polite"
                  aria-label="Afbeelding wordt geüpload"
                >
                  <Spinner size="sm" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                className="pangu-btn pangu-btn-secondary pangu-btn-sm"
                disabled={imageUploading}
                onClick={() => imageInputRef.current?.click()}
              >
                {imageUploading ? 'Uploaden...' : form.image_url ? 'Afbeelding wijzigen' : 'Afbeelding uploaden'}
              </button>
              {form.image_url && (
                <button
                  type="button"
                  className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                  disabled={imageUploading}
                  onClick={handleImageRemove}
                  style={{ color: 'var(--crimson)' }}
                >
                  Afbeelding verwijderen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Basis */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 20 }}>Basis</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="bestiary-name">Naam</label>
              <input
                id="bestiary-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van het wezen"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="bestiary-subtitle">Subtitel</label>
              <input
                id="bestiary-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Bijnaam of beschrijvende term"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={creatureTypeId}>Type</label>
              <input
                id={creatureTypeId}
                className="pangu-input"
                value={form.creature_type ?? ''}
                onChange={(e) => set('creature_type', e.target.value || null)}
                placeholder="Bijv. Ondood, Draak, Beest, Mensachtige..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={threatLevelId}>Dreigingsniveau</label>
              <input
                id={threatLevelId}
                className="pangu-input"
                value={form.threat_level ?? ''}
                onChange={(e) => set('threat_level', e.target.value || null)}
                placeholder="Bijv. CR 5, Dodelijk, Laag..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={habitatId}>Leefgebied</label>
              <input
                id={habitatId}
                className="pangu-input"
                value={form.habitat ?? ''}
                onChange={(e) => set('habitat', e.target.value || null)}
                placeholder="Bijv. Woud, Kerker, Oceaan..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as BestiaryStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Statistieken */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 20 }}>Gevechtsstats</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            <NumericField id="bestiary-hp"    label="HP"                  value={form.hp    ?? 10} onChange={(v) => set('hp',    v)} min={0} />
            <NumericField id="bestiary-ac"    label="Wapenrusting (AC)"   value={form.ac    ?? 10} onChange={(v) => set('ac',    v)} min={0} />
            <NumericField id="bestiary-speed" label="Snelheid (ft)"       value={form.speed ?? 30} onChange={(v) => set('speed', v)} min={0} />
          </div>
        </div>

        {/* Ability scores */}
        <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
          <p className="pangu-section-title" style={{ marginBottom: 20 }}>Eigenschappen</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <NumericField id="bestiary-str" label="Sterkte (STR)"       value={form.stat_str ?? 10} onChange={(v) => set('stat_str', v)} min={1} />
            <NumericField id="bestiary-dex" label="Behendigheid (DEX)"  value={form.stat_dex ?? 10} onChange={(v) => set('stat_dex', v)} min={1} />
            <NumericField id="bestiary-con" label="Constitutie (CON)"   value={form.stat_con ?? 10} onChange={(v) => set('stat_con', v)} min={1} />
            <NumericField id="bestiary-int" label="Intelligentie (INT)" value={form.stat_int ?? 10} onChange={(v) => set('stat_int', v)} min={1} />
            <NumericField id="bestiary-wis" label="Wijsheid (WIS)"      value={form.stat_wis ?? 10} onChange={(v) => set('stat_wis', v)} min={1} />
            <NumericField id="bestiary-cha" label="Charisma (CHA)"      value={form.stat_cha ?? 10} onChange={(v) => set('stat_cha', v)} min={1} />
          </div>
        </div>

        {/* Description & Notes */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <p className="pangu-section-title" style={{ marginBottom: 20 }}>Beschrijving & Notities</p>
          <div className="grid grid-cols-1 gap-4">

            <div>
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf het wezen: uiterlijk, gedrag, gevaren en bijzonderheden..."
                rows={5}
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={notesId}>DM-notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null)}
                placeholder="Aantekeningen voor de DM: tactieken, zwakheden, loot, verborgen eigenschappen..."
                rows={6}
              />
            </div>

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
              disabled={!dirty || saveBestiary.isPending}
            >
              {saveBestiary.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Wezen verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het wezen permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder wezen
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Wezen verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{bestiaryData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteBestiary.isPending}>
            {deleteBestiary.isPending ? 'Verwijderen...' : 'Verwijder wezen'}
          </button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Wezen weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Dit item is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}
