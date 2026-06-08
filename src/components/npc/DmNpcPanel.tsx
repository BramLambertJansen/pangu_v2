import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Npc } from '@/types/npc.types'
import { npcStatusLabel, npcStatusColor } from '@/lib/statusMaps'
import { pickGradient, npcGradients } from '@/utils/pickGradient'

interface Props {
  npc: Npc
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 8px',
      fontSize: 9, fontWeight: 700,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color: 'var(--muted)', fontFamily: 'var(--font-body)',
    }}>
      {children}
    </p>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'var(--hairline)', margin: '14px 0' }} />
}

export const DmNpcPanel = memo(function DmNpcPanel({ npc }: Props) {
  const navigate = useNavigate()
  const gradient = pickGradient(npc.id, npcGradients)
  const initial = npc.name.trim()[0]?.toUpperCase() ?? '?'

  return (
    <div
      role="region"
      aria-label={`DM-overzicht: ${npc.name}`}
      style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r-xl)',
        border: '1px solid rgb(var(--crimson-rgb) / 0.30)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <div style={{
        position: 'relative',
        minHeight: 100,
        background: `${gradient}, var(--surface-2)`,
        borderBottom: '1px solid var(--hairline)',
        overflow: 'hidden',
        padding: '14px 50px 14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        gap: 4,
      }}>
        {/* Watermark */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', right: 12, top: '50%',
            transform: 'translateY(-50%)',
            fontFamily: 'var(--font-display)',
            fontSize: 96, fontWeight: 700,
            color: 'var(--ink)', opacity: 0.06,
            lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
          }}
        >
          {initial}
        </div>

        {npc.npc_role && (
          <p style={{
            margin: 0, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'var(--crimson)', fontFamily: 'var(--font-body)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {npc.npc_role}
          </p>
        )}

        {npc.subtitle && (
          <p style={{
            margin: 0, fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontStyle: 'italic', fontSize: 11, color: 'var(--gold)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {npc.subtitle}
          </p>
        )}

        <h2 style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(18px, 2.6vw, 22px)',
          fontWeight: 700, color: 'var(--ink)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {npc.name}
        </h2>

        {/* Status badge */}
        <div style={{ position: 'absolute', top: 10, right: 10 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '3px 9px', borderRadius: 'var(--r-full)',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: npcStatusColor[npc.status],
            border: `1px solid ${npcStatusColor[npc.status]}55`,
            background: `${npcStatusColor[npc.status]}11`,
          }}>
            {npcStatusLabel[npc.status]}
          </span>
        </div>

        {/* Link to full detail */}
        <button
          type="button"
          aria-label={`Volledig profiel van ${npc.name}`}
          onClick={() => navigate(`/npcs/${npc.id}`)}
          style={{
            position: 'absolute', bottom: 10, right: 10,
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 'var(--r-full)',
            border: '1px solid var(--hairline)',
            background: 'transparent', cursor: 'pointer',
            fontSize: 9, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'var(--muted)', fontFamily: 'var(--font-body)',
            transition: 'color var(--t-fast), border-color var(--t-fast)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--ink)'; e.currentTarget.style.borderColor = 'var(--hairline-strong)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--hairline)' }}
        >
          Volledig profiel
          <svg aria-hidden="true" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </button>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px' }}>
        {npc.description ? (
          <>
            <SectionHeading>Beschrijving</SectionHeading>
            <p style={{
              margin: '0 0 0',
              fontSize: 13, lineHeight: 1.7,
              color: 'var(--ink-soft)', fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
            }}>
              {npc.description}
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
            Nog geen beschrijving.
          </p>
        )}

        {npc.notes && (
          <>
            <Divider />
            <SectionHeading>✦ DM-notities</SectionHeading>
            <p style={{
              margin: 0,
              fontSize: 12, lineHeight: 1.65,
              color: 'var(--ink-soft)', fontFamily: 'var(--font-body)',
              whiteSpace: 'pre-wrap',
            }}>
              {npc.notes}
            </p>
          </>
        )}
      </div>
    </div>
  )
})
