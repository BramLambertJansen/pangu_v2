import { useId } from 'react'
import type { Character } from '@/types/character.types'
import { Button } from '@/components/ui/Button'

interface Props {
  form: Character
  set: <K extends keyof Character>(key: K, value: Character[K] | null) => void
  onCancel: () => void
  onSave: () => void
  isSaving: boolean
  dirty: boolean
  committed: boolean
}

export function CharacterEditLoreSection({ form, set, onCancel, onSave, isSaving, dirty, committed }: Props) {
  const backgroundId = useId()
  const ageId = useId()
  const heightId = useId()
  const weightId = useId()
  const appearanceId = useId()
  const descriptionId = useId()
  const personalityId = useId()
  const idealsId = useId()
  const bondsId = useId()
  const flawsId = useId()
  const notesId = useId()

  return (
    <>
      {/* ── Uiterlijk ── */}
      <div className="surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pg-section-title" style={{ marginBottom: 16 }}>Uiterlijk</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label" htmlFor={ageId}>Leeftijd</label>
            <input id={ageId} className="input" value={form.age ?? ''} onChange={(e) => set('age', e.target.value || null)} placeholder="Bijv. 25 jaar" />
          </div>
          <div>
            <label className="label" htmlFor={heightId}>Lengte</label>
            <input id={heightId} className="input" value={form.height ?? ''} onChange={(e) => set('height', e.target.value || null)} placeholder="Bijv. 1,75 m" />
          </div>
          <div>
            <label className="label" htmlFor={weightId}>Gewicht</label>
            <input id={weightId} className="input" value={form.weight ?? ''} onChange={(e) => set('weight', e.target.value || null)} placeholder="Bijv. 70 kg" />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <label className="label" htmlFor={appearanceId}>Uiterlijksbeschrijving</label>
          <textarea
            id={appearanceId}
            className="textarea"
            value={form.appearance ?? ''}
            onChange={(e) => set('appearance', e.target.value || null)}
            placeholder="Haarkleur, oogkleur, huidkleur, opvallende kenmerken, tatoeages, littekens..."
            rows={3}
          />
        </div>
      </div>

      {/* ── Achtergrond & Persoonlijkheid ── */}
      <div className="surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pg-section-title" style={{ marginBottom: 16 }}>Achtergrond</p>
        <div style={{ marginBottom: 16, maxWidth: 360 }}>
          <label className="label" htmlFor={backgroundId}>Achtergrond (D&D)</label>
          <input
            id={backgroundId}
            className="input"
            value={form.background ?? ''}
            onChange={(e) => set('background', e.target.value || null)}
            placeholder="Bijv. Acolyte, Soldier, Sage..."
          />
        </div>
        <div>
          <label className="label" htmlFor={descriptionId}>Beschrijving</label>
          <textarea
            id={descriptionId}
            className="textarea"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
            placeholder="Achtergrondverhaal en uiterlijk van je personage..."
            rows={4}
          />
        </div>

        {/* Karaktereigenschappen (D&D 5.5e) */}
        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 24, marginBottom: 12, letterSpacing: '0.02em' }}>
          Karaktereigenschappen
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor={personalityId}>Persoonlijkheidskenmerken</label>
            <textarea
              id={personalityId}
              className="textarea"
              value={form.personality_traits ?? ''}
              onChange={(e) => set('personality_traits', e.target.value || null)}
              placeholder="Hoe gedraag je je? Wat zijn je gewoonten en eigenaardigheden?"
              rows={3}
            />
          </div>
          <div>
            <label className="label" htmlFor={idealsId}>Idealen</label>
            <textarea
              id={idealsId}
              className="textarea"
              value={form.ideals ?? ''}
              onChange={(e) => set('ideals', e.target.value || null)}
              placeholder="Waar geloof je in? Welke principes sturen je?"
              rows={3}
            />
          </div>
          <div>
            <label className="label" htmlFor={bondsId}>Banden</label>
            <textarea
              id={bondsId}
              className="textarea"
              value={form.bonds ?? ''}
              onChange={(e) => set('bonds', e.target.value || null)}
              placeholder="Wat verbindt je aan de wereld? Mensen, plekken, doelen?"
              rows={3}
            />
          </div>
          <div>
            <label className="label" htmlFor={flawsId}>Gebreken</label>
            <textarea
              id={flawsId}
              className="textarea"
              value={form.flaws ?? ''}
              onChange={(e) => set('flaws', e.target.value || null)}
              placeholder="Welke zwakheden of fouten heb je?"
              rows={3}
            />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="label" htmlFor={notesId}>Privénotities</label>
          <textarea
            id={notesId}
            className="textarea"
            value={form.notes ?? ''}
            onChange={(e) => set('notes', e.target.value || null)}
            placeholder="Persoonlijke aantekeningen, geheimen en doelen van je personage..."
            rows={8}
          />
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end" style={{ marginTop: 24 }}>
          <Button variant="ghost"
            onClick={onCancel}
            disabled={committed && !dirty}
          >
            Annuleren
          </Button>
          <Button variant="primary"
            onClick={onSave}
            disabled={!dirty || isSaving}
          >
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </>
  )
}
