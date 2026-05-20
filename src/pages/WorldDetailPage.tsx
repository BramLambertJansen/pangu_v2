import { useState, useEffect, useId } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { queryKeys } from '@/lib/queryKeys'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import type { World, WorldStatus } from '@/types/world.types'

const statusLabel: Record<WorldStatus, string> = {
  draft: 'Concept',
  active: 'Actief',
  archived: 'Gearchiveerd',
}

const statusVariant: Record<WorldStatus, 'default' | 'success' | 'warning'> = {
  draft: 'default',
  active: 'success',
  archived: 'warning',
}

function FormField({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const textareaClass = [
  'w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100',
  'placeholder:text-gray-500 resize-y',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
  'disabled:cursor-not-allowed disabled:opacity-50',
].join(' ')

const selectClass = [
  'h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 text-sm text-gray-100',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
].join(' ')

export default function WorldDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const descriptionId = useId()
  const quoteId = useId()
  const statusId = useId()
  const headerImageId = useId()

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [form, setForm] = useState<Partial<World>>({})
  const [dirty, setDirty] = useState(false)

  const { data: world, isLoading } = useQuery<World>({
    queryKey: queryKeys.worlds.detail(id!),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('worlds')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as World
    },
    enabled: !!id,
    staleTime: 1000 * 60,
  })

  useEffect(() => {
    if (world) {
      setForm(world)
      setDirty(false)
    }
  }, [world])

  const saveWorld = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('worlds')
        .update({
          name: form.name,
          subtitle: form.subtitle,
          quote: form.quote,
          description: form.description,
          banner_url: form.banner_url,
          status: form.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.detail(id!) })
      setDirty(false)
    },
    onError: () => {
      toast.error('Opslaan mislukt')
    },
  })

  const deleteWorld = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('worlds').delete().eq('id', id!)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.worlds.all })
      toast.success('Wereld verwijderd')
      navigate('/worlds')
    },
    onError: () => {
      toast.error('Verwijderen mislukt')
    },
  })

  function set<K extends keyof World>(key: K, value: World[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setDirty(true)
  }

  function handleSave() {
    toast.promise(saveWorld.mutateAsync(), {
      loading: 'Opslaan...',
      success: 'Wereld opgeslagen',
      error: 'Opslaan mislukt',
    })
  }

  function handleDelete() {
    toast.promise(deleteWorld.mutateAsync(), {
      loading: 'Verwijderen...',
      success: 'Wereld verwijderd',
      error: 'Verwijderen mislukt',
    })
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-20" aria-live="polite" aria-label="Wereld laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!world) {
    return (
      <section style={{ padding: 'var(--sp-8) var(--sp-6)' }}>
        <p style={{ color: 'var(--muted)' }}>Wereld niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/worlds')} className="mt-4">
          ← Terug naar werelden
        </Button>
      </section>
    )
  }

  return (
    <section aria-labelledby="world-detail-heading" style={{ padding: 'var(--sp-8) var(--sp-6)' }}>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/worlds')}
            aria-label="Terug naar werelden"
            className="rounded p-1 text-gray-400 hover:text-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1
              id="world-detail-heading"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '22px',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: 'var(--ink)',
                margin: 0,
              }}
            >
              {world.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={statusVariant[world.status]}>
                {statusLabel[world.status]}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            Verwijder wereld
          </Button>
          <Button
            onClick={handleSave}
            loading={saveWorld.isPending}
            disabled={!dirty}
          >
            Opslaan
          </Button>
        </div>
      </div>

      {/* Header image preview */}
      {form.banner_url && (
        <div
          className="mb-6 w-full overflow-hidden rounded-lg"
          style={{ height: '200px' }}
          aria-hidden="true"
        >
          <img
            src={form.banner_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Input
          label="Naam"
          value={form.name ?? ''}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Naam van de wereld"
        />

        <Input
          label="Subtitel"
          value={form.subtitle ?? ''}
          onChange={(e) => set('subtitle', e.target.value || null as unknown as string)}
          placeholder="Korte beschrijving of tagline"
        />

        <FormField label="Status" id={statusId}>
          <select
            id={statusId}
            value={form.status ?? 'draft'}
            onChange={(e) => set('status', e.target.value as WorldStatus)}
            className={selectClass}
            aria-label="Status van de wereld"
          >
            <option value="draft">Concept</option>
            <option value="active">Actief</option>
            <option value="archived">Gearchiveerd</option>
          </select>
        </FormField>

        <Input
          label="Header afbeelding (URL)"
          id={headerImageId}
          value={form.banner_url ?? ''}
          onChange={(e) => set('banner_url', e.target.value || null as unknown as string)}
          placeholder="https://..."
          type="url"
        />

        <FormField label="Quote" id={quoteId}>
          <textarea
            id={quoteId}
            value={form.quote ?? ''}
            onChange={(e) => set('quote', e.target.value || null as unknown as string)}
            placeholder="Een passende quote voor deze wereld..."
            rows={2}
            className={textareaClass}
          />
        </FormField>

        <FormField label="Beschrijving" id={descriptionId}>
          <textarea
            id={descriptionId}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null as unknown as string)}
            placeholder="Beschrijf de wereld, haar sfeer en achtergrond..."
            rows={5}
            className={textareaClass}
          />
        </FormField>
      </div>

      {/* Mobile save button */}
      <div className="mt-8 flex justify-end lg:hidden">
        <Button
          onClick={handleSave}
          loading={saveWorld.isPending}
          disabled={!dirty}
        >
          Opslaan
        </Button>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Wereld verwijderen"
      >
        <p className="mb-6 text-sm" style={{ color: 'var(--muted)' }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{world.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleteWorld.isPending}>
            Verwijder wereld
          </Button>
        </div>
      </Modal>
    </section>
  )
}
