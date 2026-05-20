export function CompassRose({ size = 80, opacity = 0.7 }: { size?: number; opacity?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ opacity }}>
      <circle cx="40" cy="40" r="38" stroke="var(--violet)" strokeWidth="0.75" strokeOpacity="0.4" />
      <circle cx="40" cy="40" r="24" stroke="var(--violet)" strokeWidth="0.5" strokeOpacity="0.3" />
      <circle cx="40" cy="40" r="4" fill="var(--violet)" fillOpacity="0.8" />
      <polygon points="40,2 44,30 40,26 36,30" fill="var(--violet)" />
      <polygon points="40,78 44,50 40,54 36,50" fill="var(--ink-soft)" fillOpacity="0.5" />
      <polygon points="78,40 50,36 54,40 50,44" fill="var(--ink-soft)" fillOpacity="0.5" />
      <polygon points="2,40 30,44 26,40 30,36" fill="var(--ink-soft)" fillOpacity="0.5" />
      <polygon points="67,13 48,36 44,32 57,23" fill="var(--gold)" fillOpacity="0.4" />
      <polygon points="13,67 32,44 36,48 23,57" fill="var(--gold)" fillOpacity="0.2" />
      <polygon points="13,13 32,36 28,32 23,23" fill="var(--gold)" fillOpacity="0.2" />
      <polygon points="67,67 48,44 52,48 57,57" fill="var(--gold)" fillOpacity="0.2" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 40 + 34 * Math.sin(rad), y1 = 40 - 34 * Math.cos(rad)
        const x2 = 40 + 37 * Math.sin(rad), y2 = 40 - 37 * Math.cos(rad)
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--violet)" strokeWidth="0.75" strokeOpacity="0.35" />
      })}
    </svg>
  )
}
