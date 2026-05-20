import { useMemo } from 'react'

interface Star {
  id: number
  x: number
  y: number
  r: number
  opacity: number
  isGold: boolean
}

// URL-encoded SVG fractal noise for grain texture
const GRAIN_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"

/** Full-screen starfield + gradient + grain background layers. All layers are fixed-position. */
export function CosmicBackground() {
  const stars = useMemo<Star[]>(() => {
    // Seeded xorshift32 for deterministic star positions (no flicker on re-render)
    let s = 0xdeadbeef
    const rand = () => {
      s ^= s << 13
      s ^= s >> 17
      s ^= s << 5
      return (s >>> 0) / 0x100000000
    }
    return Array.from({ length: 220 }, (_, id) => ({
      id,
      x: rand() * 1600,
      y: rand() * 1100,
      r: 0.25 + rand() * 1.2,
      opacity: 0.18 + rand() * 0.55,
      isGold: rand() < 0.06,
    }))
  }, [])

  return (
    <>
      {/* Violet/gold radial gradient backdrop */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 0,
          background: [
            'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(155, 138, 255, 0.08), transparent 60%)',
            'radial-gradient(ellipse 60% 80% at 100% 100%, rgba(245, 200, 66, 0.04), transparent 60%)',
            'var(--void)',
          ].join(', '),
        }}
      />

      {/* SVG star field */}
      <svg
        aria-hidden="true"
        className="fixed inset-0 h-full w-full pointer-events-none"
        style={{ zIndex: 1 }}
        viewBox="0 0 1600 1100"
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map(({ id, x, y, r, opacity, isGold }) => (
          <g key={id}>
            <circle cx={x} cy={y} r={r} fill={isGold ? '#f5c842' : '#f0ecf7'} opacity={opacity} />
            {isGold && (
              <>
                <line x1={x - r * 4} y1={y} x2={x + r * 4} y2={y} stroke="#f5c842" strokeWidth="0.4" opacity={opacity * 0.5} />
                <line x1={x} y1={y - r * 4} x2={x} y2={y + r * 4} stroke="#f5c842" strokeWidth="0.4" opacity={opacity * 0.5} />
              </>
            )}
          </g>
        ))}
      </svg>

      {/* Fractal-noise grain overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 2, opacity: 0.04, mixBlendMode: 'overlay', backgroundImage: GRAIN_URL }}
      />
    </>
  )
}
