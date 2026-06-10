import { useState } from 'react'
import { toast } from 'sonner'
import { SelectableCardGrid } from '@/components/ui/SelectableCardGrid'
import { AlignmentGrid } from '@/components/character/AlignmentGrid'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Chip } from '@/components/ui/Chip'
import { FormField } from '@/components/ui/FormField'
import { useAI } from '@/hooks/useAI'
import { getRace, getClass, getBackground, SRD_BACKGROUNDS } from '@/data/dnd5e'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  patch: (updates: Partial<WizardDraft>) => void
}

interface TraitSuggestion {
  personality: string
  ideal: string
  bond: string
  flaw: string
}

function parseTraitSuggestion(raw: string): TraitSuggestion {
  let cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '')
  const objectMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objectMatch) cleaned = objectMatch[0]
  const parsed = JSON.parse(cleaned) as Record<string, unknown>
  return {
    personality: String(parsed['personality'] ?? ''),
    ideal: String(parsed['ideal'] ?? ''),
    bond: String(parsed['bond'] ?? ''),
    flaw: String(parsed['flaw'] ?? ''),
  }
}

export function StepBackground({ draft, patch }: Props) {
  const { ask, loading: aiLoading } = useAI()
  const [overwriteOpen, setOverwriteOpen] = useState(false)
  const selected = getBackground(draft.backgroundId)
  const hasTraitText = [draft.personality, draft.ideal, draft.bond, draft.flaw].some(
    (t) => t.trim().length > 0,
  )

  async function generateTraits() {
    setOverwriteOpen(false)
    const race = getRace(draft.raceId)
    const cls = getClass(draft.classId)
    const prompt = `Genereer roleplay-eigenschappen voor een D&D 5e level 1 karakter:
${draft.name ? `Naam: ${draft.name}` : ''}
Ras: ${race?.name ?? 'onbekend'}, klasse: ${cls?.name ?? 'onbekend'}, achtergrond: ${selected?.name ?? 'onbekend'}${draft.alignment ? `, uitlijning: ${draft.alignment}` : ''}.
Schrijf in het Nederlands, elk veld 1-2 zinnen, in de eerste persoon.
Antwoord met ALLEEN een rauw JSON-object, zonder uitleg of markdown:
{"personality":"...","ideal":"...","bond":"...","flaw":"..."}`
    try {
      const reply = await ask([{ role: 'user', content: prompt }])
      const suggestion = parseTraitSuggestion(reply)
      patch({
        personality: suggestion.personality,
        ideal: suggestion.ideal,
        bond: suggestion.bond,
        flaw: suggestion.flaw,
      })
      toast.success('Suggesties ingevuld — pas ze gerust aan')
    } catch {
      toast.error('Genereren mislukt — probeer het later opnieuw')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <SelectableCardGrid
        label="Achtergrond"
        compact
        value={draft.backgroundId}
        onSelect={(id) => patch({ backgroundId: id === draft.backgroundId ? null : id })}
        options={SRD_BACKGROUNDS.map((bg) => ({
          id: bg.id,
          title: bg.name,
          tagline: bg.description,
          meta: bg.skills.join(' · '),
        }))}
      />

      {selected && (
        <div className="option-detail !mt-0">
          <span className="option-detail-glyph" aria-hidden="true">❧</span>
          <div className="min-w-0 flex-1">
            <p className="option-detail-title">{selected.feature}</p>
            <p className="option-detail-text">{selected.featureDescription}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selected.skills.map((skill) => (
                <Chip key={skill} tone="teal">Vaardig: {skill}</Chip>
              ))}
              {selected.toolProficiencies.map((tool) => (
                <Chip key={tool}>{tool}</Chip>
              ))}
              {selected.languagesNote && <Chip tone="violet">{selected.languagesNote}</Chip>}
            </div>
          </div>
        </div>
      )}

      <FormField label="Uitlijning" hint="Optioneel — je morele kompas">
        <AlignmentGrid
          value={draft.alignment}
          onChange={(alignment) =>
            patch({ alignment: alignment === draft.alignment ? null : alignment })
          }
        />
      </FormField>

      <div>
        <div className="form-field-head">
          <span className="label">Roleplay-eigenschappen</span>
          <Button
            variant="ghost"
            size="sm"
            loading={aiLoading}
            onClick={() => (hasTraitText ? setOverwriteOpen(true) : void generateTraits())}
          >
            ✨ Stel voor (AI)
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Textarea
            label="Persoonlijkheid"
            rows={3}
            value={draft.personality}
            onChange={(e) => patch({ personality: e.target.value })}
            placeholder="Hoe gedraag je je? Gewoonten, eigenaardigheden..."
          />
          <Textarea
            label="Ideaal"
            rows={3}
            value={draft.ideal}
            onChange={(e) => patch({ ideal: e.target.value })}
            placeholder="Waar geloof je in?"
          />
          <Textarea
            label="Band"
            rows={3}
            value={draft.bond}
            onChange={(e) => patch({ bond: e.target.value })}
            placeholder="Wat verbindt je aan de wereld?"
          />
          <Textarea
            label="Gebrek"
            rows={3}
            value={draft.flaw}
            onChange={(e) => patch({ flaw: e.target.value })}
            placeholder="Welke zwakheid kan je fataal worden?"
          />
        </div>
      </div>

      <ConfirmDialog
        open={overwriteOpen}
        onClose={() => setOverwriteOpen(false)}
        onConfirm={() => void generateTraits()}
        title="Bestaande tekst overschrijven?"
        confirmLabel="Genereer en overschrijf"
        confirmVariant="primary"
      >
        Er staat al tekst in een of meer velden. AI-suggesties vervangen de huidige inhoud van
        alle vier de velden.
      </ConfirmDialog>
    </div>
  )
}
