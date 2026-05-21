interface Props {
  label: string
}

export function WorldDetailDivider({ label }: Props) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', margin: '48px 0 40px' }}
      aria-hidden="true"
    >
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, var(--hairline-strong))' }} />
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        padding: '8px 20px',
        border: '1px solid var(--hairline-strong)',
        borderRadius: 'var(--r-full)',
        background: 'var(--void-2)',
        flexShrink: 0,
      }}>
        <span style={{ color: 'var(--gold)', fontSize: 10 }}>❋</span>
        <span style={{
          fontFamily: 'var(--font-body)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)',
        }}>
          {label}
        </span>
        <span style={{ color: 'var(--gold)', fontSize: 10 }}>❋</span>
      </div>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, var(--hairline-strong))' }} />
    </div>
  )
}
