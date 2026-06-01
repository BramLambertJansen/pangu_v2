import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LinkEntityModal } from '@/components/link/LinkEntityModal'

// Mock all campaign query hooks so they return empty lists
vi.mock('@/hooks/queries/useCampaignLocations', () => ({
  useCampaignLocations: () => ({ data: [{ id: 'loc-1', name: 'De Scheve Toren' }] }),
}))
vi.mock('@/hooks/queries/useCampaignNpcs', () => ({
  useCampaignNpcs: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignLore', () => ({
  useCampaignLore: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignQuests', () => ({
  useCampaignQuests: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignSessions', () => ({
  useCampaignSessions: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignItems', () => ({
  useCampaignItems: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignEncounters', () => ({
  useCampaignEncounters: () => ({ data: [] }),
}))
vi.mock('@/hooks/queries/useCampaignCharacters', () => ({
  useCampaignCharacters: () => ({ data: [] }),
}))

const mockMutateAsync = vi.fn().mockResolvedValue(undefined)
vi.mock('@/hooks/queries/useEntityLinks', () => ({
  useCreateLink: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
  useDeleteLink: () => ({ mutate: vi.fn(), isPending: false }),
  useEntityLinks: () => ({ data: [], isLoading: false }),
}))

function setup(props: Partial<Parameters<typeof LinkEntityModal>[0]> = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LinkEntityModal
          open={true}
          onClose={onClose}
          sourceType="npc"
          sourceId="npc-1"
          campaignId="camp-1"
          {...props}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  return { onClose }
}

describe('LinkEntityModal', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows step 1 — type selection — when opened', () => {
    setup()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Stap 1 van 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Type entiteit')).toBeInTheDocument()
  })

  it('each select has an associated label', () => {
    setup()
    const typeSelect = screen.getByLabelText('Type entiteit')
    expect(typeSelect.tagName).toBe('SELECT')
  })

  it('advances to step 2 after selecting a type', () => {
    setup()
    const typeSelect = screen.getByLabelText('Type entiteit')
    fireEvent.change(typeSelect, { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    expect(screen.getByText('Stap 2 van 3')).toBeInTheDocument()
  })

  it('shows back button in step 2', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Type entiteit'), { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    expect(screen.getByText('← Terug')).toBeInTheDocument()
  })

  it('back button from step 2 returns to step 1', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Type entiteit'), { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    fireEvent.click(screen.getByText('← Terug'))
    expect(screen.getByText('Stap 1 van 3')).toBeInTheDocument()
  })

  it('advances to step 3 after selecting a relation', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Type entiteit'), { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    fireEvent.change(screen.getByLabelText('Relatie'), { target: { value: 'located_in' } })
    fireEvent.click(screen.getByText('Volgende →'))
    expect(screen.getByText('Stap 3 van 3')).toBeInTheDocument()
  })

  it('step 3 shows entity list from campaign hook', () => {
    setup()
    fireEvent.change(screen.getByLabelText('Type entiteit'), { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    fireEvent.change(screen.getByLabelText('Relatie'), { target: { value: 'located_in' } })
    fireEvent.click(screen.getByText('Volgende →'))
    expect(screen.getByText('De Scheve Toren')).toBeInTheDocument()
  })

  it('calls mutateAsync with correct args on submit', async () => {
    setup()
    // Step 1
    fireEvent.change(screen.getByLabelText('Type entiteit'), { target: { value: 'location' } })
    fireEvent.click(screen.getByText('Volgende →'))
    // Step 2
    fireEvent.change(screen.getByLabelText('Relatie'), { target: { value: 'located_in' } })
    fireEvent.click(screen.getByText('Volgende →'))
    // Step 3 — select entity
    fireEvent.click(screen.getByText('De Scheve Toren'))
    fireEvent.click(screen.getByText('Verbinden'))

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        campaign_id: 'camp-1',
        from_type: 'npc',
        from_id: 'npc-1',
        to_type: 'location',
        to_id: 'loc-1',
        relation: 'located_in',
      })
    })
  })

  it('excludes sourceType from the type dropdown', () => {
    setup()
    const typeSelect = screen.getByLabelText('Type entiteit')
    const options = Array.from(typeSelect.querySelectorAll('option')).map(o => o.value)
    expect(options).not.toContain('npc')
    expect(options).toContain('location')
  })
})
