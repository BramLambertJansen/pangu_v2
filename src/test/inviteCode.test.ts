import { describe, it, expect } from 'vitest'
import { generateInviteCode } from '@/utils/inviteCode'

describe('generateInviteCode', () => {
  it('matches the WORD-WORD-NNNN format', () => {
    expect(generateInviteCode()).toMatch(/^[A-Z]+-[A-Z]+-\d{4}$/)
  })

  it('always produces a 4-digit number in 1000–9999 (no leading-zero collapse) and two distinct words', () => {
    for (let i = 0; i < 1000; i++) {
      const code = generateInviteCode()
      expect(code).toMatch(/^[A-Z]+-[A-Z]+-\d{4}$/)
      const [first, second, digitsPart] = code.split('-')
      const digits = Number(digitsPart)
      expect(digits).toBeGreaterThanOrEqual(1000)
      expect(digits).toBeLessThanOrEqual(9999)
      expect(first).not.toBe(second)
    }
  })

  it('uses uppercase alphabetic word parts', () => {
    const [first, second] = generateInviteCode().split('-')
    expect(first).toMatch(/^[A-Z]+$/)
    expect(second).toMatch(/^[A-Z]+$/)
  })
})
