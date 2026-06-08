import { useMemo } from 'react'

interface Star {
  id: number
  x: number
  y: number
  r: number
  opacity: number
  isGold: boolean
}

export interface StarfieldProps {
  /** Number of seeded stars to render. */
  count?: number
  className?: string
}

/**
 * Deterministic star-chart backdrop for the PANGU void. Colors are token-driven
 * (`--starfield-star` / `--starfield-gold`) so a theme swap re-tints the cosmos
 * without touching this component.
 */
export function Starfield({ count = 220, className }: StarfieldProps) {
  const stars = useMemo<Star[]>(() => {
    // Seeded xorshift32 for deterministic star positions (no flicker on re-render)
    let s = 0xdeadbeef
    const rand = () => {
      s ^= s << 13
      s ^= s >> 17
      s ^= s << 5
      return (s >>> 0) / 0x100000000
    }
    return Array.from({ length: count }, (_, id) => ({
      id,
      x: rand() * 1600,
      y: rand() * 1100,
      r: 0.25 + rand() * 1.2,
      opacity: 0.18 + rand() * 0.55,
      isGold: rand() < 0.06,
    }))
  }, [count])

  return (
    <svg
      className={className ?? 'fixed inset-0 h-full w-full pointer-events-none'}
      style={{ zIndex: 1 }}
      viewBox="0 0 1600 1100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {stars.map(({ id, x, y, r, opacity, isGold }) => (
        <g key={id}>
          <circle cx={x} cy={y} r={r} fill={isGold ? 'var(--starfield-gold)' : 'var(--starfield-star)'} opacity={opacity} />
          {isGold && (
            <>
              <line x1={x - r * 4} y1={y} x2={x + r * 4} y2={y} stroke="var(--starfield-gold)" strokeWidth="0.4" opacity={opacity * 0.5} />
              <line x1={x} y1={y - r * 4} x2={x} y2={y + r * 4} stroke="var(--starfield-gold)" strokeWidth="0.4" opacity={opacity * 0.5} />
            </>
          )}
        </g>
      ))}
    </svg>
  )
}
