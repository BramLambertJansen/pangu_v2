import { memo } from 'react'
import type { Spell } from '@/types/spell.types'
import { EntityCard } from '@/components/ui/EntityCard'
import { pickGradient, spellGradients } from '@/utils/pickGradient'
import { spellSchoolLabel, spellSchoolColor } from '@/lib/statusMaps'

interface Props {
  spell: Spell
  onDelete?: () => void
  onClick?: () => void
}

export const SpellCard = memo(function SpellCard({ spell, onDelete, onClick }: Props) {
  const gradient = pickGradient(spell.id, spellGradients)
  const levelLabel = spell.level === 0 ? 'Kantrip' : `Niveau ${spell.level}`

  return (
    <EntityCard variant="compact" ariaLabel={`Spreuk: ${spell.name}`} onClick={onClick}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: gradient, pointerEvents: 'none' }} />

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)', color: spellSchoolColor[spell.school] }}>
              {levelLabel} · {spellSchoolLabel[spell.school]}
            </p>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(16px, 3vw, 20px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {spell.name}
            </h2>
          </div>

          {/* Badges + delete */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
            {spell.concentration && (
              <span title="Concentratie vereist" aria-label="Concentratie vereist" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold)', border: '1px solid rgba(245,180,50,0.3)', borderRadius: 4, padding: '1px 5px' }}>C</span>
            )}
            {spell.ritual && (
              <span title="Ritueel" aria-label="Ritueel" style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--teal)', border: '1px solid rgba(62,207,178,0.3)', borderRadius: 4, padding: '1px 5px' }}>R</span>
            )}
            {spell.source?.startsWith('srd') && (
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--azure)', border: '1px solid rgba(56,152,255,0.3)', borderRadius: 4, padding: '1px 5px' }}>{spell.source === 'srd-2024' ? 'SRD 2024' : 'SRD'}</span>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); onDelete() }}
                aria-label={`${spell.name} verwijderen`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--muted)', padding: 0 }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--crimson)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)' }}
              >
                <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
          {spell.casting_time && <span>{spell.casting_time}</span>}
          {spell.range && <span aria-label={`Bereik: ${spell.range}`}>{spell.range}</span>}
          {spell.duration && <span>{spell.duration}</span>}
        </div>

        {/* Classes */}
        {spell.classes.length > 0 && (
          <p style={{ margin: 0, fontSize: 11, color: 'var(--subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {spell.classes.join(' · ')}
          </p>
        )}
      </div>
    </EntityCard>
  )
})
