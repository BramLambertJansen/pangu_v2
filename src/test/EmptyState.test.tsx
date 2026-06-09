import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '@/components/ui/EmptyState'

describe('EmptyState', () => {
  it('renders title with status role', () => {
    render(<EmptyState title="Niets te zien" />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Niets te zien')).toHaveClass('empty-title')
  })

  it('renders icon, description, quote, and action when provided', () => {
    render(
      <EmptyState
        icon="🌐"
        title="Leeg"
        description="Begin hier"
        quote="Citaat"
        action={<button>Doe iets</button>}
      />,
    )
    expect(screen.getByText('🌐')).toHaveClass('empty-glyph')
    expect(screen.getByText('Begin hier')).toHaveClass('empty-sub')
    expect(screen.getByText(/Citaat/)).toHaveClass('empty-quote')
    expect(screen.getByRole('button', { name: 'Doe iets' })).toBeInTheDocument()
  })

  it('applies error variant class', () => {
    const { container } = render(<EmptyState variant="error" title="Fout" />)
    expect(container.querySelector('.empty')).toHaveClass('empty-error')
  })

  it('renders inline layout when inline is set', () => {
    const { container } = render(
      <EmptyState inline icon="⚔" title="Geen helden" description="Voeg toe" />,
    )
    expect(container.querySelector('.empty')).toBeNull()
    expect(container.querySelector('.empty-inline')).not.toBeNull()
    expect(container.querySelector('.empty-inline-title')?.textContent).toBe('Geen helden')
  })

  it('omits optional parts when not provided', () => {
    const { container } = render(<EmptyState title="x" />)
    expect(container.querySelector('.empty-glyph')).toBeNull()
    expect(container.querySelector('.empty-sub')).toBeNull()
    expect(container.querySelector('.empty-quote')).toBeNull()
    expect(container.querySelector('.empty-actions')).toBeNull()
  })
})
