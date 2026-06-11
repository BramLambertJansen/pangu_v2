import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '@/utils/inviteCode'

describe('generateInviteCode', () => {
  it('matches the WORD-NNNN format', () => {
    expect(generateInviteCode()).toMatch(/^[A-Z]+-\d{4}$/)
  })

  it('always produces a 4-digit number in 1000–9999 (no leading-zero collapse)', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateInviteCode()
      expect(code).toMatch(/^[A-Z]+-\d{4}$/)
      const digits = Number(code.split('-')[1])
      expect(digits).toBeGreaterThanOrEqual(1000)
      expect(digits).toBeLessThanOrEqual(9999)
    }
  })

  it('uses an uppercase alphabetic word part', () => {
    const word = generateInviteCode().split('-')[0]
    expect(word).toMatch(/^[A-Z]+$/)
    expect(word.length).toBeGreaterThan(0)
  })
})
