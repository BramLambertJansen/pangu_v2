import { useMemo, useState } from 'react'
import { PickProgress } from '@/components/ui/PickProgress'
import { SelectableCardGrid } from '@/components/ui/SelectableCardGrid'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { CompendiumBrowser } from '@/components/compendium/CompendiumBrowser'
import { useSpells } from '@/hooks/queries/useSpells'
import { useImportSpell } from '@/hooks/queries/useSrdSearch'
import { spellSchoolLabel } from '@/lib/statusMaps'
import { getClass } from '@/data/dnd5e'
import { isCasterAtLevel1 } from '@/utils/characterWizard'
import type { Spell } from '@/types/spell.types'
import type { Open5eSpell } from '@/types/open5e.types'
import type { SrdClass } from '@/types/srd5e.types'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
  patch: (updates: Partial<WizardDraft>) => void
}

function matchesClass(spell: Spell, cls: SrdClass): boolean {
  return spell.classes.some((c) => c.toLowerCase() === cls.name.toLowerCase())
}

function toOption(spell: Spell) {
  return {
    id: spell.id,
    title: spell.name,
    tagline: `${spell.casting_time} · ${spell.range}`,
    meta: spellSchoolLabel[spell.school] ?? spell.school,
  }
}

export function StepSpells({ draft, patch }: Props) {
  const cls = getClass(draft.classId)
  const { data: spells, isLoading } = useSpells()
  const importSpell = useImportSpell()
  const [importOpen, setImportOpen] = useState(false)

  const library = useMemo(() => {
    if (!cls) return { cantrips: [] as Spell[], levelOne: [] as Spell[] }
    const forClass = (spells ?? []).filter((s) => matchesClass(s, cls))
    return {
      cantrips: forClass.filter((s) => s.level === 0),
      levelOne: forClass.filter((s) => s.level === 1),
    }
  }, [spells, cls])

  if (!cls) return null

  if (!isCasterAtLevel1(cls)) {
    return (
      <EmptyState
        icon={cls.glyph}
        title={`${cls.name} werpt nog geen spreuken`}
        description={
          cls.spellNote ?? 'Jouw kracht ligt in staal, niet in magie. Ga door naar het overzicht.'
        }
      />
    )
  }

  const toggle = (key: 'cantripIds' | 'spellIds', max: number) => (id: string) => {
    const current = draft[key]
    if (current.includes(id)) {
      patch({ [key]: current.filter((s) => s !== id) })
    } else if (current.length < max) {
      patch({ [key]: [...current, id], spellsDeferred: false })
    }
  }

  const importedSlugs = (spells ?? [])
    .map((s) => s.source_slug)
    .filter((s): s is string => s !== null)

  const sections = [
    {
      key: 'cantripIds' as const,
      title: 'Tovertrucs (level 0)',
      max: cls.cantripsKnown,
      itemsLabel: 'tovertrucs',
      options: library.cantrips,
    },
    {
      key: 'spellIds' as const,
      title: 'Spreuken (level 1)',
      max: cls.spellPicksL1,
      itemsLabel: 'spreuken',
      options: library.levelOne,
    },
  ].filter((section) => section.max > 0)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 text-xs text-muted">
          {cls.spellNote ?? `Kies uit je spreukenbibliotheek (klasse: ${cls.name}).`}
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportOpen(true)}>
            Importeer uit SRD
          </Button>
          <Button
            variant="ghost"
            size="sm"
            aria-pressed={draft.spellsDeferred}
            onClick={() => patch({ spellsDeferred: !draft.spellsDeferred })}
          >
            {draft.spellsDeferred ? '✓ Keuze uitgesteld' : 'Spreuken later kiezen'}
          </Button>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.key}>
          <p className="label mb-2">{section.title}</p>
          <PickProgress
            count={draft[section.key].length}
            total={section.max}
            itemsLabel={section.itemsLabel}
            className="mb-3"
          />
          {section.options.length === 0 ? (
            <p className="m-0 text-sm italic text-muted">
              {isLoading
                ? 'Bibliotheek laden...'
                : `Geen ${section.itemsLabel} voor ${cls.name} in je bibliotheek — importeer ze uit het SRD.`}
            </p>
          ) : (
            <SelectableCardGrid
              label={section.title}
              multiple
              compact
              value={draft[section.key]}
              onSelect={toggle(section.key, section.max)}
              options={section.options.map((spell) => ({
                ...toOption(spell),
                disabled:
                  !draft[section.key].includes(spell.id) &&
                  draft[section.key].length >= section.max,
              }))}
            />
          )}
        </div>
      ))}

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Spreuken importeren uit SRD"
        size="lg"
      >
        <CompendiumBrowser
          kind="spell"
          onImport={(data, edition) => importSpell.mutate({ spell: data as Open5eSpell, edition })}
          importedSlugs={importedSlugs}
          isPending={importSpell.isPending}
        />
      </Modal>
    </div>
  )
}
