import { describe, it, expect } from 'vitest'
import { getApiError } from '@/utils/apiError'

function fakeResponse(json: () => Promise<unknown>): Response {
  return { json } as unknown as Response
}

describe('getApiError', () => {
  it('returns the error field from a JSON body', async () => {
    const res = fakeResponse(async () => ({ error: 'Iets ging mis' }))
    expect(await getApiError(res, 'fallback')).toBe('Iets ging mis')
  })

  it('returns the fallback when the body has no error field', async () => {
    const res = fakeResponse(async () => ({ data: 123 }))
    expect(await getApiError(res, 'fallback')).toBe('fallback')
  })

  it('returns the fallback when the body is not valid JSON', async () => {
    const res = fakeResponse(async () => {
      throw new SyntaxError('Unexpected token')
    })
    expect(await getApiError(res, 'fallback')).toBe('fallback')
  })
})
