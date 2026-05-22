import { useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import type { Location, LocationStatus } from '@/types/location.types'

const statusOptions: { value: LocationStatus; label: string }[] = [
  { value: 'draft',      label: 'Concept'      },
  { value: 'active',     label: 'Actief'       },
  { value: 'discovered', label: 'Ontdekt'      },
  { value: 'archived',   label: 'Gearchiveerd' },
]

export default function LocationEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const locationTypeId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: locationData, isLoading } = useQuery<Location>({
    queryKey: queryKeys.campaigns.locationDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Location
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm,
  } = useEntityEdit({ entity: locationData, isNew })

  const campaignId = locationData?.campaign_id ?? campaignIdFromState

  const saveLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('locations')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          location_type: form.location_type ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(campaignId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locationDetail(id!) })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteLocation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('locations').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.locationDetail(id!) })
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.locations(campaignId) })
        navigate(`/campaigns/${campaignId}/locations`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function handleCancel() {
    if (!committed) {
      if (campaignId) {
        navigate(`/campaigns/${campaignId}/locations`)
      } else {
        navigate('/dashboard')
      }
    } else {
      resetForm()
      navigate(`/locations/${id}`)
    }
  }

  function handleBack() {
    if (!committed) {
      if (campaignId) {
        navigate(`/campaigns/${campaignId}/locations`)
      } else {
        navigate('/dashboard')
      }
    } else {
      navigate(`/locations/${id}`)
    }
  }

  function handleSave() {
    toast.promise(saveLocation.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Locatie opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteLocation.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Locatie verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Locatie laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!locationData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Locatie niet gevonden.</p>
        <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
          ← Terug naar dashboard
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
          aria-label="Terug naar locatie"
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
          Terug naar locatie
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Locatie bewerken</p>
          <h1 className="pangu-display-xl">{locationData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van deze locatie aan.
          </p>
        </header>

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="location-name">Naam</label>
              <input
                id="location-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van de locatie"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="location-subtitle">Subtitel</label>
              <input
                id="location-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte omschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={locationTypeId}>Type locatie</label>
              <input
                id={locationTypeId}
                className="pangu-input"
                value={form.location_type ?? ''}
                onChange={(e) => set('location_type', e.target.value || null)}
                placeholder="Bijv. Stad, Kerker, Herberg, Woud..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as LocationStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={descriptionId}>Beschrijving</label>
              <textarea
                id={descriptionId}
                className="pangu-textarea"
                value={form.description ?? ''}
                onChange={(e) => set('description', e.target.value || null)}
                placeholder="Beschrijf de locatie, haar sfeer en bijzonderheden..."
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null)}
                placeholder="Aantekeningen voor de DM: geheimen, NPCs, verborgen items..."
                rows={8}
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
              disabled={!dirty || saveLocation.isPending}
            >
              {saveLocation.isPending ? 'Opslaan...' : 'Opslaan'}
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
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Locatie verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert de locatie permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder locatie
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Locatie verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{locationData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteLocation.isPending}>
            {deleteLocation.isPending ? 'Verwijderen...' : 'Verwijder locatie'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
