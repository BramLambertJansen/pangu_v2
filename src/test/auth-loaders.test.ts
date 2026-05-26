import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'react-router-dom'

// Hoist mock factories so vi.mock can reference them
const mockGetSession = vi.fn()
const mockFrom = vi.fn()
const mockGetState = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: { getSession: mockGetSession },
    from: mockFrom,
  },
}))

vi.mock('@/stores/auth.store', () => ({
  useAuthStore: { getState: mockGetState },
}))

// React Router's redirect returns a Response — match its shape for assertions
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    redirect: vi.fn((url: string) => ({ status: 302, headers: { Location: url } })),
  }
})

// Import loaders AFTER mocks are registered
const { requireAuth, requireAdmin } = await import('@/routes/loaders')

function sessionOf(role?: string) {
  return {
    data: {
      session: role !== undefined
        ? { user: { id: 'uid-1' } }
        : null,
    },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAuth', () => {
  it('redirects to /login when no session', async () => {
    mockGetSession.mockResolvedValue(sessionOf())
    const result = await requireAuth()
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(result).toMatchObject({ status: 302 })
  })

  it('returns null when session exists', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user'))
    const result = await requireAuth()
    expect(result).toBeNull()
  })
})

describe('requireAdmin', () => {
  it('redirects to /login when no session', async () => {
    mockGetSession.mockResolvedValue(sessionOf())
    const result = await requireAdmin()
    expect(redirect).toHaveBeenCalledWith('/login')
    expect(result).toMatchObject({ status: 302 })
  })

  it('returns null when stored profile has role=admin', async () => {
    mockGetSession.mockResolvedValue(sessionOf('admin'))
    mockGetState.mockReturnValue({ profile: { role: 'admin' } })
    const result = await requireAdmin()
    expect(result).toBeNull()
  })

  it('redirects to /dashboard when stored profile has role=user', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user'))
    mockGetState.mockReturnValue({ profile: { role: 'user' } })
    const result = await requireAdmin()
    expect(redirect).toHaveBeenCalledWith('/dashboard')
    expect(result).toMatchObject({ status: 302 })
  })

  it('fetches role from DB when profile not in store and allows admin', async () => {
    mockGetSession.mockResolvedValue(sessionOf('admin'))
    mockGetState.mockReturnValue({ profile: null })

    const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'admin' } })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await requireAdmin()
    expect(result).toBeNull()
  })

  it('fetches role from DB when profile not in store and blocks non-admin', async () => {
    mockGetSession.mockResolvedValue(sessionOf('user'))
    mockGetState.mockReturnValue({ profile: null })

    const mockSingle = vi.fn().mockResolvedValue({ data: { role: 'user' } })
    const mockEq = vi.fn().mockReturnValue({ single: mockSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ select: mockSelect })

    const result = await requireAdmin()
    expect(redirect).toHaveBeenCalledWith('/dashboard')
    expect(result).toMatchObject({ status: 302 })
  })
})
