import { useId, useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { useEntityEdit } from '@/hooks/useEntityEdit'
import { useEncounterWithCampaign, useEncounterMonstersEdit, useSaveEncounter, useDeleteEncounter } from '@/hooks/queries/useEncounter'
import { useWorldBestiaries } from '@/hooks/queries/useWorldBestiaries'
import { useCampaignSessions } from '@/hooks/queries/useCampaignSessions'
import { useAuthStore } from '@/stores/auth.store'
import type { EncounterStatus } from '@/types/encounter.types'
import type { Bestiary } from '@/types/bestiary.types'

type MonsterRow = {
  bestiary_id: string
  name: string
  creature_type: string | null
  threat_level: string | null
  count: number
}

const statusOptions: { value: EncounterStatus; label: string }[] = [
  { value: 'draft',     label: 'Concept'      },
  { value: 'ready',     label: 'Klaar'        },
  { value: 'active',    label: 'Actief'       },
  { value: 'completed', label: 'Voltooid'     },
  { value: 'archived',  label: 'Gearchiveerd' },
]

export default function EncounterEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)

  const subtitleId = useId()
  const descriptionId = useId()
  const notesId = useId()
  const statusId = useId()
  const environmentId = useId()
  const difficultyId = useId()
  const sessionId = useId()
  const searchId = useId()

  const locationState = location.state as { isNew?: boolean; campaignId?: string } | null
  const isNew = locationState?.isNew ?? false
  const campaignIdFromState = locationState?.campaignId

  // Monster picker state
  const [monsters, setMonsters] = useState<MonsterRow[]>([])
  const [monstersDirty, setMonstersDirty] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [search, setSearch] = useState('')

  const { data: encounterData, isLoading } = useEncounterWithCampaign(id)
  const { data: existingMonsters } = useEncounterMonstersEdit(id)

  const campaignId = encounterData?.campaign_id ?? campaignIdFromState
  const worldId = encounterData?.campaigns?.world_id

  // Initialise monster list from fetched data (only once)
  useEffect(() => {
    if (existingMonsters && !monstersDirty) {
      setMonsters(existingMonsters.map((m) => ({
        bestiary_id: m.bestiary_id,
        name: m.bestiaries?.name ?? '(onbekend)',
        creature_type: m.bestiaries?.creature_type ?? null,
        threat_level: m.bestiaries?.threat_level ?? null,
        count: m.count,
      })))
    }
  }, [existingMonsters, monstersDirty])

  const { data: bestiaries } = useWorldBestiaries(worldId)
  const { data: sessions } = useCampaignSessions(campaignId)

  const {
    form, set, dirty, setDirty,
    committed, setCommitted,
    deleteOpen, setDeleteOpen,
    resetForm, guard,
  } = useEntityEdit({ entity: encounterData, isNew })

  const isDirtyOverall = dirty || monstersDirty

  const saveEncounter = useSaveEncounter(id!)
  const deleteEncounter = useDeleteEncounter(id!)

  async function handleDiscardConfirm() {
    if (guard.isDraftDiscard) {
      try {
        await deleteEncounter.mutateAsync({ campaignId })
      } catch {
        return
      }
    }
    const handled = guard.confirmLeave()
    if (!handled) {
      if (campaignId) navigate(`/campaigns/${campaignId}/encounters`)
      else navigate('/dashboard')
    }
  }

  function handleCancel() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      resetForm()
      if (campaignId) navigate(`/campaigns/${campaignId}/encounters`)
      else navigate('/dashboard')
    }
  }

  function handleBack() {
    if (!committed) {
      guard.requestDiscard()
    } else {
      if (campaignId) navigate(`/campaigns/${campaignId}/encounters`)
      else navigate('/dashboard')
    }
  }

  function handleSave() {
    toast.promise(
      saveEncounter.mutateAsync({
        form,
        monsters: monsters.map((m) => ({ bestiary_id: m.bestiary_id, count: m.count })),
        userId: user!.id,
      }).then(() => { setCommitted(true); setDirty(false); setMonstersDirty(false) }),
      { loading: 'Opslaan...', success: 'Gevecht opgeslagen', error: 'Opslaan mislukt' },
    )
  }

  function handleDelete() {
    toast.promise(
      deleteEncounter.mutateAsync({ campaignId }).then(() => {
        if (campaignId) navigate(`/campaigns/${campaignId}/encounters`)
        else navigate('/dashboard')
      }),
      { loading: 'Verwijderen...', success: 'Gevecht verwijderd', error: 'Verwijderen mislukt' },
    )
    setDeleteOpen(false)
  }

  // Monster picker helpers
  const alreadySelected = new Set(monsters.map((m) => m.bestiary_id))
  const filteredBestiaries = (bestiaries ?? []).filter(
    (b) => !alreadySelected.has(b.id) && b.name.toLowerCase().includes(search.toLowerCase())
  )

  function addMonster(b: Bestiary) {
    setMonsters((prev) => [
      ...prev,
      { bestiary_id: b.id, name: b.name, creature_type: b.creature_type, threat_level: b.threat_level, count: 1 },
    ])
    setMonstersDirty(true)
    setSearch('')
  }

  function removeMonster(bestiary_id: string) {
    setMonsters((prev) => prev.filter((m) => m.bestiary_id !== bestiary_id))
    setMonstersDirty(true)
  }

  function changeCount(bestiary_id: string, delta: number) {
    setMonsters((prev) =>
      prev.map((m) =>
        m.bestiary_id === bestiary_id
          ? { ...m, count: Math.max(1, m.count + delta) }
          : m
      )
    )
    setMonstersDirty(true)
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }} aria-live="polite" aria-label="Gevecht laden...">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!encounterData) {
    return (
      <div>
        <p style={{ color: 'var(--muted)' }}>Gevecht niet gevonden.</p>
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
          aria-label="Terug naar gevechten"
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
          Terug naar gevechten
        </button>

        {/* Page header */}
        <header style={{ marginBottom: 40 }}>
          <p className="pangu-eyebrow">Gevecht bewerken</p>
          <h1 className="pangu-display-xl">{encounterData.name}</h1>
          <p style={{ marginTop: 8, fontSize: 14, color: 'var(--ink-soft)' }}>
            Pas de details en monsters van dit gevecht aan.
          </p>
        </header>

        {/* ── Part A: Entity fields ────────────────────── */}
        <div className="pangu-surface" style={{ padding: 28 }}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>
              <label className="pangu-label" htmlFor="encounter-name">Naam</label>
              <input
                id="encounter-name"
                className="pangu-input"
                value={form.name ?? ''}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Naam van het gevecht"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={subtitleId}>Subtitel</label>
              <input
                id={subtitleId}
                className="pangu-input"
                value={form.subtitle ?? ''}
                onChange={(e) => set('subtitle', e.target.value || null)}
                placeholder="Korte omschrijving of sfeerwoorden"
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={environmentId}>Omgeving</label>
              <input
                id={environmentId}
                className="pangu-input"
                value={form.environment ?? ''}
                onChange={(e) => set('environment', e.target.value || null)}
                placeholder="Bijv. Kerker, Bos, Stad, Tempel..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={difficultyId}>Moeilijkheidsgraad</label>
              <input
                id={difficultyId}
                className="pangu-input"
                value={form.difficulty ?? ''}
                onChange={(e) => set('difficulty', e.target.value || null)}
                placeholder="Bijv. Gemakkelijk, Normaal, Moeilijk, Dodelijk..."
              />
            </div>

            <div>
              <label className="pangu-label" htmlFor={statusId}>Status</label>
              <select
                id={statusId}
                className="pangu-select"
                value={form.status ?? 'draft'}
                onChange={(e) => set('status', e.target.value as EncounterStatus)}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="pangu-label" htmlFor={sessionId}>Sessie (optioneel)</label>
              <select
                id={sessionId}
                className="pangu-select"
                value={form.session_id ?? ''}
                onChange={(e) => set('session_id', e.target.value || null)}
              >
                <option value="">Geen sessie</option>
                {sessions?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.session_number != null ? `#${s.session_number} — ` : ''}{s.name}
                  </option>
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
                placeholder="Beschrijf de setting, de inzet, de sfeer van dit gevecht..."
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
                placeholder="Tactieken, verrassingen, triggers, doelen voor de monsters..."
                rows={6}
              />
            </div>

          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
            <button
              type="button"
              className="pangu-btn pangu-btn-ghost"
              onClick={handleCancel}
              disabled={committed && !isDirtyOverall}
            >
              Annuleren
            </button>
            <button
              type="button"
              className="pangu-btn pangu-btn-primary"
              onClick={handleSave}
              disabled={!isDirtyOverall || saveEncounter.isPending}
            >
              {saveEncounter.isPending ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </div>

        {/* ── Part B: Monster list ─────────────────────── */}
        <div className="pangu-surface" style={{ marginTop: 24, padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p className="pangu-section-title" style={{ marginBottom: 2 }}>Monsters</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
                {monsters.length === 0 ? 'Nog geen monsters toegevoegd.' : `${monsters.length} soort${monsters.length !== 1 ? 'en' : ''} geselecteerd`}
              </p>
            </div>
            {!pickerOpen && (
              <button
                type="button"
                className="pangu-btn pangu-btn-secondary pangu-btn-sm"
                onClick={() => setPickerOpen(true)}
                disabled={!worldId || !bestiaries}
              >
                + Monster toevoegen
              </button>
            )}
          </div>

          {/* Current monster list */}
          {monsters.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              {monsters.map((m) => (
                <div
                  key={m.bestiary_id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 12, padding: '10px 0',
                    borderBottom: '1px solid var(--hairline)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)', fontSize: 14, lineHeight: 1.3 }}>
                      {m.name}
                    </p>
                    {(m.creature_type || m.threat_level) && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {[m.creature_type, m.threat_level ? `CR ${m.threat_level}` : null].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  {/* Count controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button
                      type="button"
                      aria-label={`${m.name} één minder`}
                      onClick={() => changeCount(m.bestiary_id, -1)}
                      style={{
                        width: 36, height: 36, minWidth: 36, minHeight: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--hairline-strong)', borderRadius: 6,
                        background: 'none', cursor: 'pointer', color: 'var(--ink-soft)',
                        fontSize: 16, lineHeight: 1, touchAction: 'manipulation',
                        transition: 'border-color var(--t-fast), color var(--t-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--crimson)'; e.currentTarget.style.color = 'var(--crimson)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; e.currentTarget.style.color = 'var(--ink-soft)' }}
                    >
                      −
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, color: 'var(--ink)', fontSize: 14 }}>
                      {m.count}
                    </span>
                    <button
                      type="button"
                      aria-label={`${m.name} één meer`}
                      onClick={() => changeCount(m.bestiary_id, 1)}
                      style={{
                        width: 36, height: 36, minWidth: 36, minHeight: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--hairline-strong)', borderRadius: 6,
                        background: 'none', cursor: 'pointer', color: 'var(--ink-soft)',
                        fontSize: 16, lineHeight: 1, touchAction: 'manipulation',
                        transition: 'border-color var(--t-fast), color var(--t-fast)',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--hairline-strong)'; e.currentTarget.style.color = 'var(--ink-soft)' }}
                    >
                      +
                    </button>

                    {/* Remove */}
                    <button
                      type="button"
                      aria-label={`${m.name} verwijderen`}
                      onClick={() => removeMonster(m.bestiary_id)}
                      style={{
                        width: 36, height: 36, minWidth: 36, minHeight: 36,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: 'none', background: 'none', cursor: 'pointer',
                        color: 'var(--muted)', marginLeft: 4, touchAction: 'manipulation',
                        transition: 'color var(--t-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--crimson)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted)')}
                    >
                      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4h6v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Monster picker panel */}
          {pickerOpen && (
            <div
              style={{
                border: '1px solid var(--hairline-strong)',
                borderRadius: 10,
                overflow: 'hidden',
                background: 'var(--void-2)',
              }}
            >
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--hairline)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <label htmlFor={searchId} className="sr-only">Zoek monster</label>
                <input
                  id={searchId}
                  className="pangu-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam..."
                  autoFocus
                  style={{ flex: 1, margin: 0 }}
                />
                <button
                  type="button"
                  className="pangu-btn pangu-btn-ghost pangu-btn-sm"
                  onClick={() => { setPickerOpen(false); setSearch('') }}
                  aria-label="Picker sluiten"
                >
                  Sluiten
                </button>
              </div>

              <div
                style={{ maxHeight: 'min(280px, calc(100dvh - 260px))', overflowY: 'auto' }}
                role="listbox"
                aria-label="Beschikbare monsters"
              >
                {filteredBestiaries.length === 0 ? (
                  <p style={{ padding: '16px', fontSize: 13, color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
                    {bestiaries && bestiaries.length === 0
                      ? 'Het bestiarium van deze wereld is leeg.'
                      : search
                        ? 'Geen monsters gevonden.'
                        : 'Alle beschikbare monsters zijn al geselecteerd.'}
                  </p>
                ) : (
                  filteredBestiaries.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => addMonster(b)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', padding: '10px 16px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        borderBottom: '1px solid var(--hairline)',
                        textAlign: 'left',
                        transition: 'background var(--t-fast)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220,90,80,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, color: 'var(--ink)', fontSize: 14, lineHeight: 1.3 }}>
                          {b.name}
                        </p>
                        {(b.creature_type || b.threat_level) && (
                          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            {[b.creature_type, b.threat_level ? `CR ${b.threat_level}` : null].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0, fontSize: 12, color: 'var(--muted)' }}>
                        {b.hp > 0 && <span>HP {b.hp}</span>}
                        {b.ac > 0 && <span>AC {b.ac}</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Save monsters hint */}
          {monstersDirty && (
            <p style={{ marginTop: 16, fontSize: 12, color: 'var(--gold)', fontStyle: 'italic' }}>
              Wijzigingen in de monsterlijst worden opgeslagen via de knop hierboven.
            </p>
          )}
        </div>

        {/* Danger zone */}
        <div
          className="pangu-surface"
          style={{ marginTop: 24, padding: 28, borderColor: 'rgba(255,107,107,0.18)' }}
        >
          <p className="pangu-section-title" style={{ marginBottom: 4 }}>Gevarenzone</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--ink-soft)', margin: 0 }}>Gevecht verwijderen</p>
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: '2px 0 0' }}>
                Dit verwijdert het gevecht en alle bijbehorende monsters permanent.
              </p>
            </div>
            <button
              type="button"
              className="pangu-btn pangu-btn-crimson pangu-btn-sm"
              onClick={() => setDeleteOpen(true)}
            >
              Verwijder gevecht
            </button>
          </div>
        </div>

      </div>

      {/* Delete modal */}
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Gevecht verwijderen"
      >
        <p style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 24 }}>
          Weet je zeker dat je <strong style={{ color: 'var(--ink)' }}>{encounterData.name}</strong> wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="pangu-btn pangu-btn-ghost" onClick={() => setDeleteOpen(false)}>
            Annuleren
          </button>
          <button type="button" className="pangu-btn pangu-btn-crimson" onClick={handleDelete} disabled={deleteEncounter.isPending}>
            {deleteEncounter.isPending ? 'Verwijderen...' : 'Verwijder gevecht'}
          </button>
        </div>
      </Modal>

      {/* Discard dialog */}
      <ConfirmDialog
        open={guard.discardOpen}
        onClose={guard.cancelLeave}
        onConfirm={handleDiscardConfirm}
        title={guard.isDraftDiscard ? 'Gevecht weggooien?' : 'Niet-opgeslagen wijzigingen'}
        confirmLabel={guard.isDraftDiscard ? 'Weggooien' : 'Verlaten'}
        cancelLabel={guard.isDraftDiscard ? 'Annuleren' : 'Blijven'}
        confirmVariant="crimson"
      >
        {guard.isDraftDiscard
          ? 'Dit gevecht is nog niet opgeslagen en wordt permanent verwijderd. Doorgaan?'
          : 'Je hebt niet-opgeslagen wijzigingen. Weet je zeker dat je de pagina wilt verlaten?'
        }
      </ConfirmDialog>
    </div>
  )
}
