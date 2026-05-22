import { useState, useEffect, useId } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import type { Lore, LoreStatus } from '@/types/lore.types'

const statusOptions: { value: LoreStatus; label: string }[] = [
  { value: 'draft',    label: 'Concept'      },
  { value: 'active',   label: 'Actief'       },
  { value: 'archived', label: 'Gearchiveerd' },
]

export default function LoreEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const loreCategoryId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const [committed, setCommitted] = useState(!isNew)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<Lore>>({})
  const [dirty, setDirty] = useState(false)

  const { data: loreData, isLoading } = useQuery<Lore>({
    queryKey: queryKeys.campaigns.loreDetail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lore')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Lore
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (loreData) {
      setForm(loreData)
      setDirty(false)
    }
  }, [loreData])

  const campaignId = loreData?.campaign_id ?? campaignIdFromState

  const saveLore = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('lore')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          description: form.description,
          notes: form.notes,
          status: form.status,
          lore_category: form.lore_category ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(campaignId) })
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.loreDetail(id!) })
      setCommitted(true)
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteLore = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('lore').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: queryKeys.campaigns.loreDetail(id!) })
      if (campaignId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(campaignId) })
        navigate(`/campaigns/${campaignId}/lore`)
      } else {
        navigate('/dashboard')
      }
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function set<K extends keyof Lore>(key: K, value: Lore[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  async function abandon() {
    const { error } = await supabase.from('lore').delete().eq('id', id!)
    if (error) {
      toast.error('Lore-item kon niet worden verwijderd')
      return
    }
    if (campaignId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.lore(campaignId) })
      navigate(`/campaigns/${campaignId}/lore`)
    } else {
      navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      abandon()
    } else {
      setForm(loreData!)
      setDirty(false)
      navigate(`/campaigns/${campaignId}/lore`)
    }
  }

  function handleBack() {
    if (!committed) {
      abandon()
    } else {
      navigate(`/campaigns/${campaignId}/lore`)
    }
  }

  function handleSave() {
    toast.promise(saveLore.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Lore opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteLore.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Lore verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Lore laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!loreData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Lore niet gevonden.</p>
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
          aria-label="Terug naar lore"
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
          Terug naar lore
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Lore bewerken</p>
          <h1 className="pangu-display-xl">{loreData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details van dit lore-item aan.
          </p>
        </header>

        {/* Form */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="lore-name">Naam</label>
              <input
                id="lore-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van het lore-item"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor="lore-subtitle">Subtitel</label>
              <input
                id="lore-subtitle"
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null as unknown as string)}
                placeholder="Korte omschrijving of tagline"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={loreCategoryId}>Categorie</label>
              <input
                id={loreCategoryId}
                className="pangu-input"
                value={form.lore_category ?? ''}
                onChange={(e) => set('lore_category', e.target.value || null as unknown as string)}
                placeholder="Bijv. Mythe, Legende, Factie, Religie, Magie..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as LoreStatus)}
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
                onChange={(e) => set('description', e.target.value || null as unknown as string)}
                placeholder="Beschrijf dit lore-item, haar oorsprong en betekenis..."
                rows={4}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="pangu-label" htmlFor={notesId}>DM notities</label>
              <textarea
                id={notesId}
                className="pangu-textarea"
                value={form.notes ?? ''}
                onChange={(e) => set('notes', e.target.value || null as unknown as string)}
                placeholder="Aantekeningen voor de DM: verborgen verbanden, plot hooks, geheimen..."
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
              disabled={!dirty || saveLore.isPending}
            >
              {saveLore.isPending ? 'Opslaan...' : 'Opslaan'}
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
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Lore verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het lore-item permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder lore
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Lore verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{loreData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteLore.isPending}>
            {deleteLore.isPending ? 'Verwijderen...' : 'Verwijder lore'}
          </button>
        </div>
      </Modal>
    </div>
  )
}
