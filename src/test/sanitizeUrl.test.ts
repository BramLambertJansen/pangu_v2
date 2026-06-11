import { describe, it, expect } from 'vitest'
import { sanitizeImageUrl } from '@/utils/sanitizeUrl'

describe('sanitizeImageUrl', () => {
  it('returns the normalized href for valid https URLs', () => {
    expect(sanitizeImageUrl('https://example.com/cat.png')).toBe('https://example.com/cat.png')
  })

  it('preserves path and query string', () => {
    expect(sanitizeImageUrl('https://cdn.test/img/a.jpg?w=200&h=100'))
      .toBe('https://cdn.test/img/a.jpg?w=200&h=100')
  })

  it('rejects http (non-secure) URLs', () => {
    expect(sanitizeImageUrl('http://example.com/cat.png')).toBeUndefined()
  })

  it('rejects javascript: and data: protocols (XSS vectors)', () => {
    expect(sanitizeImageUrl('javascript:alert(1)')).toBeUndefined()
    expect(sanitizeImageUrl('data:image/png;base64,AAAA')).toBeUndefined()
  })

  it('rejects unparseable garbage', () => {
    expect(sanitizeImageUrl('not a url')).toBeUndefined()
    expect(sanitizeImageUrl('://broken')).toBeUndefined()
  })

  it('returns undefined for null, undefined and empty string', () => {
    expect(sanitizeImageUrl(null)).toBeUndefined()
    expect(sanitizeImageUrl(undefined)).toBeUndefined()
    expect(sanitizeImageUrl('')).toBeUndefined()
  })
})
