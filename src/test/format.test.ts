import { describe, it, expect } from 'vitest'
import { formatDate } from '@/utils/format'

describe('formatDate', () => {
  it('returns null for null input', () => {
    expect(formatDate(null)).toBeNull()
  })

  it('formats a YYYY-MM-DD date as a Dutch long date', () => {
    const result = formatDate('2026-06-11')
    expect(result).toContain('11')
    expect(result).toContain('juni')
    expect(result).toContain('2026')
  })

  it('parses a date-only string as a local calendar day (no UTC-midnight shift)', () => {
    // Naive UTC parsing would shift this to the 10th in negative-offset zones.
    expect(formatDate('2026-06-11')).toContain('11')
  })

  it('formats a full ISO timestamp via Intl instead of the date-only path', () => {
    // A non-date-only string must not match the YYYY-MM-DD fast path, so the
    // year/month/day are not re-parsed as separate local-date components.
    const xmas = formatDate('2026-12-25T23:30:00Z')
    expect(xmas).toContain('25')
    expect(xmas).toContain('2026')
  })
})
