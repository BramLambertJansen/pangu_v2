import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

function wrap(ui: React.ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('Breadcrumbs', () => {
  it('renders ordered list with aria label and aria-current on terminal', () => {
    wrap(
      <Breadcrumbs
        items={[
          { label: 'Werelden', to: '/worlds' },
          { label: 'Aerthos', to: '/worlds/1' },
        ]}
        current="Bestiarium"
      />,
    )
    const list = screen.getByRole('list', { name: /kruimelpad/i })
    expect(list).toBeInTheDocument()
    const current = screen.getByText('Bestiarium')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('renders a Link when item has `to`', () => {
    wrap(<Breadcrumbs items={[{ label: 'Werelden', to: '/worlds' }, { label: 'Hier' }]} />)
    const link = screen.getByRole('link', { name: 'Werelden' })
    expect(link).toHaveAttribute('href', '/worlds')
  })

  it('renders a button when item has onClick and triggers it', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    wrap(<Breadcrumbs items={[{ label: 'Terug', onClick }, { label: 'Hier' }]} />)
    await user.click(screen.getByRole('button', { name: 'Terug' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('promotes a trailing static item to current (back-compat)', () => {
    wrap(<Breadcrumbs items={[{ label: 'Werelden', to: '/worlds' }, { label: 'Aerthos' }]} />)
    expect(screen.getByText('Aerthos')).toHaveAttribute('aria-current', 'page')
  })

  it('renders back button when showBack is true and calls onBack', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    wrap(<Breadcrumbs showBack onBack={onBack} items={[{ label: 'Hier' }]} />)
    const back = screen.getByRole('button', { name: /terug/i })
    await user.click(back)
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('applies is-arcane class for arcane variant', () => {
    const { container } = wrap(
      <Breadcrumbs variant="arcane" items={[{ label: 'A', to: '/a' }]} current="B" />,
    )
    const ol = container.querySelector('ol.breadcrumb')
    expect(ol).toHaveClass('is-arcane')
    expect(container.querySelector('.sep-glyph')).not.toBeNull()
    expect(container.querySelector('.sep-glyph')?.textContent).toBe('✦')
  })

  it('applies compact class for compact prop', () => {
    const { container } = wrap(
      <Breadcrumbs compact items={[{ label: 'A', to: '/a' }, { label: 'B' }]} />,
    )
    expect(container.querySelector('ol.breadcrumb')).toHaveClass('compact')
  })

  it('renders ellipsis dropdown when collapse is set', () => {
    const { container } = wrap(
      <Breadcrumbs
        collapse={{ start: 1, end: -2 }}
        items={[
          { label: 'A', to: '/a' },
          { label: 'B', to: '/b' },
          { label: 'C', to: '/c' },
          { label: 'D', to: '/d' },
          { label: 'E' },
        ]}
      />,
    )
    expect(container.querySelector('.bc-ellipsis')).not.toBeNull()
    expect(container.querySelector('.bc-dropdown')).not.toBeNull()
    // B and C should be inside the dropdown, not in the main row
    expect(screen.getByRole('link', { name: 'B' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'C' })).toBeInTheDocument()
  })
})
