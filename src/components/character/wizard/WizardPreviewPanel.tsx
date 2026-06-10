import { Avatar } from '@/components/ui/Avatar'
import { Chip } from '@/components/ui/Chip'
import { ABILITY_SCORES, formatModifier } from '@/utils/dnd5e'
import { finalScores, deriveLevel1Stats } from '@/utils/characterWizard'
import { getRace, getClass, getBackground } from '@/data/dnd5e'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import type { WizardDraft } from '@/types/character_wizard.types'

interface Props {
  draft: WizardDraft
}

/** Live samenvatting van de wizard-draft (zijpaneel). */
export function WizardPreviewPanel({ draft }: Props) {
  const race = getRace(draft.raceId)
  const cls = getClass(draft.classId)
  const background = getBackground(draft.backgroundId)
  const scores = finalScores(draft)
  const derived = deriveLevel1Stats(draft)
  const identity = [race?.name, cls?.name].filter(Boolean).join(' · ')

  return (
    <div className="surface p-4">
      <p className="pg-eyebrow mb-3">Preview</p>

      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <Avatar
          size="lg"
          src={sanitizeImageUrl(draft.portraitUrl)}
          alt={draft.name || 'Naamloos karakter'}
          fallback={cls?.glyph ?? '✦'}
        />
        <div>
          <p className="m-0 text-sm font-semibold text-ink">{draft.name || 'Naamloos'}</p>
          <p className="m-0 text-xs text-muted">{identity ? `${identity} · Level 1` : 'Level 1'}</p>
        </div>
      </div>

      <dl className="m-0 flex flex-col gap-1.5 text-xs">
        {[
          { label: 'Ras', value: race?.name },
          { label: 'Klasse', value: cls?.name },
          { label: 'Achtergrond', value: background?.name },
          { label: 'Uitlijning', value: draft.alignment },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="text-muted">{label}</dt>
            <dd className="m-0 truncate text-right text-ink-soft">{value ?? '—'}</dd>
          </div>
        ))}
      </dl>

      {cls && (
        <>
          <div className="my-3 h-px bg-hairline" aria-hidden="true" />
          <div className="grid grid-cols-3 gap-1.5">
            {ABILITY_SCORES.map((ability) => {
              const total = scores[ability.key]
              return (
                <div
                  key={ability.key}
                  className="surface-2 rounded-md px-1 py-1.5 text-center"
                  aria-label={`${ability.label}: ${total ?? 'nog niet toegewezen'}`}
                >
                  <p className="m-0 text-[9px] tracking-wider text-muted">{ability.abbr}</p>
                  <p className="m-0 text-sm font-bold text-ink">{total ?? '—'}</p>
                  <p className="m-0 text-[10px] text-violet">
                    {total === null ? '' : formatModifier(total)}
                  </p>
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            <Chip>HP {derived.hpMax}</Chip>
            <Chip>AC {derived.armorClass}</Chip>
            <Chip>{derived.speed} ft</Chip>
          </div>
        </>
      )}

      {draft.skillProficiencies.length > 0 && (
        <>
          <div className="my-3 h-px bg-hairline" aria-hidden="true" />
          <p className="label mb-1.5">Vaardigheden</p>
          <p className="m-0 text-xs leading-relaxed text-ink-soft">
            {draft.skillProficiencies.join(', ')}
          </p>
        </>
      )}
    </div>
  )
}
