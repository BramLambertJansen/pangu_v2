import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useAI } from '@/hooks/useAI'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { useNpc, useSaveNpc, useDeleteNpc } from '@/hooks/queries/useNpc'
import { useCampaignFactions } from '@/hooks/queries/useCampaignFactions'
import type { NpcStatus } from '@/types/npc.types'
import { npcStatusLabel, optionsFromLabels } from '@/lib/statusMaps'

const statusOptions = optionsFromLabels(npcStatusLabel)

export default function NpcEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const { ask, loading: aiLoading } = useAI()
  const [aiPreview, setAiPreview] = useState<string | null>(null)

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  const { data: npcData, isLoading } = useNpc(id)
  const saveNpc = useSaveNpc(id!)
  const deleteNpc = useDeleteNpc(id!)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: npcData, isNew })

  const campaignId = npcData?.campaign_id ?? campaignIdFromState
  const { data: factions } = useCampaignFactions(npcData?.campaign_id ?? campaignIdFromState)

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteNpc.mutateAsync({ campaignId, factionId: npcData?.faction_id })
      } catch {
        return
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/npcs`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (campaignId) navigate(`/campaigns/${campaignId}/npcs`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/npcs`)
      else navigate('/dashboard')
    }
  }

  async function handleGenerateDescription() {
    const name = form.name?.trim()
    if (!name) {
      toast.error('Vul eerst een naam in voordat je genereert')
      return
    }
    const roleHint = form.npc_role ? ` (${form.npc_role})` : ''
    const subtitleHint = form.subtitle ? ` — ${form.subtitle}` : ''
    const existingHint = form.description?.trim()
      ? ` De huidige beschrijving luidt: "${form.description.trim()}". Verbeter of breid deze uit.`
      : ''
    try {
      const reply = await ask([
        {
          role: 'user',
          content:
            `Je bent een creatieve schrijver voor een tabletop RPG-campagne (D&D-stijl). ` +
            `Schrijf een levendige beschrijving (3–5 zinnen in het Nederlands) voor het personage ` +
            `"${name}"${roleHint}${subtitleHint}. ` +
            `Beschrijf uiterlijk, persoonlijkheid en eerste indruk; geef het personage karakter.` +
            existingHint +
            ` Geef alleen de beschrijvingstekst terug, zonder koptekst of uitleg.`,
        },
      ])
      setAiPreview(reply.trim())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Genereren mislukt')
    }
  }

  function handleAcceptGenerated() {
    if (aiPreview !== null) {
      set('description', aiPreview || null)
      setAiPreview(null)
      toast.success('Beschrijving overgenomen')
    }
  }

  function handleSave() {
    toast.promise(
      saveNpc.mutateAsync({ ...form, oldFactionId: npcData?.faction_id }).then(() => {
        setCommitted(true)
        setDirty(false)
      }),
      { loading: 'Opslaan...', success: 'NPC opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteNpc.mutateAsync({ campaignId, factionId: npcData?.faction_id }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/npcs`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'NPC verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="NPC laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!npcData) {
    return (
      <div>
        <p className="text-muted">NPC niet gevonden.</p>
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mt-4">
          ← Terug naar dashboard
        </Button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <div style={{ maxWidth: 820, width: '100%' }}>

        <Breadcrumbs
          showBack
          onBack={handleBack}
          items={[{ label: npcData.name, to: `/npcs/${id}` }]}
          current="Bewerken"
        />

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pg-eyebrow">NPC bewerken</p>
          <h1 className="pg-display-xl">{npcData.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Pas de details van dit personage aan.
          </p>
        </header>

        {/* Form */}
        <div className="surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <Input
              label="Naam"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Naam van het personage"
            />

            <Input
              label="Subtitel"
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value || null)}
              placeholder="Bijnaam, titel of tagline"
            />

            <Input
              label="Rol"
              value={form.npc_role ?? ''}
              onChange={(e) => set('npc_role', e.target.value || null)}
              placeholder="Bijv. Schurk, Bondgenoot, Koopman, Gids..."
            />

            <Select
              label="Status"
              value={form.status ?? 'draft'}
              onChange={(e) => set('status', e.target.value as NpcStatus)}
              options={statusOptions}
            />

            <Select
              label="Factie"
              value={form.faction_id ?? ''}
              onChange={(e) => set('faction_id', e.target.value || null)}
            >
              <option value="">— Geen factie —</option>
              {factions?.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </Select>

            <div className="sm:col-span-2">
              <Textarea
                label="Beschrijving"
                value={form.description ?? ''}
                onChange={(e) => { set('description', e.target.value || null); setAiPreview(null) }}
                placeholder="Beschrijf het personage, uiterlijk, persoonlijkheid en achtergrond..."
                rows={4}
                labelAction={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    loading={aiLoading}
                    aria-label="Genereer beschrijving met AI"
                  >
                    ✦ Genereer
                  </Button>
                }
              />
              {aiPreview !== null && (
                <div role="status" aria-live="polite" className="ai-suggestion">
                  <p className="ai-suggestion-label">AI-suggestie</p>
                  <p className="ai-suggestion-text">{aiPreview}</p>
                  <div className="ai-suggestion-actions">
                    <Button variant="secondary" size="sm" onClick={handleAcceptGenerated}>
                      Overnemen
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setAiPreview(null)}>
                      Negeren
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Textarea
              fieldClassName="sm:col-span-2"
              label="DM notities"
              value={form.notes ?? ''}
              onChange={(e) => set('notes', e.target.value || null)}
              placeholder="Aantekeningen voor de DM: geheimen, motieven, verborgen agenda's..."
              rows={8}
            />

          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <Button variant="ghost"
              onClick={handleCancel}
              disabled={committed && !dirty}
            >
              Annuleren
            </Button>
            <Button variant="primary"
              onClick={handleSave}
              disabled={!dirty || saveNpc.isPending}
            >
              {saveNpc.isPending ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgb(var(--crimson-rgb) / 0.18)' }}
        >
          <p className="pg-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>NPC verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het personage permanent en kan niet ongedaan worden gemaakt.
              </p>
            </div>
            <Button variant="danger" size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder NPC
            </Button>
          </div>
        </div>

      </div>
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="NPC verwijderen"
        confirmLabel="Verwijder NPC"
        loading={deleteNpc.isPending}
      >
        Weet je zeker dat je <strong className="text-ink">{npcData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
      </ConfirmDialog>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'NPC weggooien?' : 'Niet-opgeslagen wijzigingen'}
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
