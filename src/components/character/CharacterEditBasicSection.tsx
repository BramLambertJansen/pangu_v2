import { useId } from 'react'
import { NumericField } from '@/components/character/CharacterEditHelpers'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'
import type { Character, CharacterStatus, HitDie } from '@/types/character.types'
import type { Campaign } from '@/types/campaign.types'
import type { useImagePositioning } from '@/hooks/useImagePositioning'

type ImageHandlers = ReturnType<typeof useImagePositioning>['handlers']

const HIT_DIE_OPTIONS: HitDie[] = ['d6', 'd8', 'd10', 'd12']

const statusOptions: { value: CharacterStatus; label: string }[] = [
  { value: 'active',   label: 'Actief'         },
  { value: 'inactive', label: 'Inactief'        },
  { value: 'retired',  label: 'Teruggetrokken' },
  { value: 'archived', label: 'Gearchiveerd'   },
]

interface Props {
  form: Character
  set: <K extends keyof Character>(key: K, value: Character[K] | null) => void
  campaigns: Pick<Campaign, 'id' | 'name'>[] | undefined
  portraitContainerRef: React.RefObject<HTMLDivElement | null>
  portraitPosString: string
  portraitIsDragging: boolean
  portraitPosHandlers: ImageHandlers
}

export function CharacterEditBasicSection({
  form, set, campaigns,
  portraitContainerRef, portraitPosString, portraitIsDragging, portraitPosHandlers,
}: Props) {
  const subtitleId = useId()
  const statusId = useId()
  const campaignSelectId = useId()
  const portraitUrlId = useId()
  const classId = useId()
  const subclassId = useId()
  const raceId = useId()
  const alignmentId = useId()

  return (
    <>
      {/* ── Basisinfo ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Basisinfo</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="pangu-label" htmlFor="char-name">Naam</label>
            <input
              id="char-name"
              className="pangu-input"
              value={form.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Naam van je personage"
            />
          </div>
          <div>
            <label className="pangu-label" htmlFor={subtitleId}>Subtitel</label>
            <input
              id={subtitleId}
              className="pangu-input"
              value={form.subtitle ?? ''}
              onChange={(e) => set('subtitle', e.target.value || null)}
              placeholder="Bijnaam of tagline"
            />
          </div>
          <div>
            <label className="pangu-label" htmlFor={statusId}>Status</label>
            <select
              id={statusId}
              className="pangu-select"
              value={form.status ?? 'active'}
              onChange={(e) => set('status', e.target.value as CharacterStatus)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="pangu-label" htmlFor={campaignSelectId}>Kroniek</label>
            <select
              id={campaignSelectId}
              className="pangu-select"
              value={form.campaign_id ?? ''}
              onChange={(e) => set('campaign_id', e.target.value || null)}
            >
              <option value="">Geen kroniek</option>
              {campaigns?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Portrait URL + draggable reposition preview */}
        <div style={{ marginTop: 16 }}>
          <label className="pangu-label" htmlFor={portraitUrlId}>Portret (URL)</label>
          <input
            id={portraitUrlId}
            className="pangu-input"
            type="url"
            value={form.portrait_url ?? ''}
            onChange={(e) => set('portrait_url', e.target.value || null)}
            placeholder="https://..."
          />
          {sanitizeImageUrl(form.portrait_url) && (
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, userSelect: 'none' }}>
                Sleep om uitsnede aan te passen
              </p>
              <div
                ref={portraitContainerRef}
                role="img"
                aria-label={`Portretuitsnede: positie ${portraitPosString}. Gebruik pijltjestoetsen om bij te stellen.`}
                tabIndex={0}
                onMouseDown={portraitPosHandlers.onMouseDown}
                onTouchStart={portraitPosHandlers.onTouchStart}
                onKeyDown={portraitPosHandlers.onKeyDown}
                style={{
                  position: 'relative',
                  cursor: portraitIsDragging ? 'grabbing' : 'grab',
                  borderRadius: 8,
                  overflow: 'hidden',
                  width: 160,
                  height: 220,
                  border: '1px solid var(--hairline)',
                  userSelect: 'none',
                  touchAction: 'none',
                  outline: 'none',
                }}
                onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 2px var(--violet)' }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none' }}
              >
                <img
                  src={sanitizeImageUrl(form.portrait_url)!}
                  alt=""
                  draggable={false}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: portraitPosString,
                    pointerEvents: 'none',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Karakter ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Karakter</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="pangu-label" htmlFor={classId}>Klasse</label>
            <input
              id={classId}
              className="pangu-input"
              value={form.character_class ?? ''}
              onChange={(e) => set('character_class', e.target.value || null)}
              placeholder="Bijv. Barbaar, Magiër, Schurk..."
            />
          </div>
          <div>
            <label className="pangu-label" htmlFor={subclassId}>Subklasse</label>
            <input
              id={subclassId}
              className="pangu-input"
              value={form.character_subclass ?? ''}
              onChange={(e) => set('character_subclass', e.target.value || null)}
              placeholder="Bijv. Razernijpad, Waarzegger..."
            />
          </div>
          <div>
            <label className="pangu-label" htmlFor={raceId}>Ras / Soort</label>
            <input
              id={raceId}
              className="pangu-input"
              value={form.character_race ?? ''}
              onChange={(e) => set('character_race', e.target.value || null)}
              placeholder="Bijv. Mens, Elf, Dwerg..."
            />
          </div>
          <NumericField
            id="char-level"
            label="Level"
            value={form.level ?? 1}
            onChange={(v) => set('level', Math.min(20, Math.max(1, v)))}
            min={1}
            max={20}
          />
          <div>
            <label className="pangu-label" htmlFor="char-hit-die">Trefferdobbelsteen</label>
            <select
              id="char-hit-die"
              className="pangu-select"
              value={form.hit_die ?? 'd8'}
              onChange={(e) => set('hit_die', e.target.value as HitDie)}
            >
              {HIT_DIE_OPTIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="pangu-label" htmlFor={alignmentId}>Uitlijning</label>
            <input
              id={alignmentId}
              className="pangu-input"
              value={form.alignment ?? ''}
              onChange={(e) => set('alignment', e.target.value || null)}
              placeholder="Bijv. Wettig goed, Neutraal, Chaotisch kwaad..."
            />
          </div>
        </div>
      </div>

      {/* ── Ervaring ── */}
      <div className="pangu-surface" style={{ padding: 28, marginBottom: 16 }}>
        <p className="pangu-section-title" style={{ marginBottom: 16 }}>Ervaring</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumericField
            id="char-xp"
            label="Huidige XP"
            value={form.xp ?? 0}
            onChange={(v) => set('xp', Math.max(0, v))}
          />
          <NumericField
            id="char-xp-next"
            label="Volgende level (XP)"
            value={form.xp_next ?? 300}
            onChange={(v) => set('xp_next', Math.max(1, v))}
            min={1}
          />
        </div>
      </div>
    </>
  )
}
