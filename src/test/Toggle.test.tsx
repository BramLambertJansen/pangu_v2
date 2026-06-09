import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Toggle } from '@/components/ui/Toggle'

describe('Toggle', () => {
  it('renders a switch role with aria-checked', () => {
    render(<Toggle checked={true} onChange={vi.fn()} aria-label="Donker thema" />)
    const sw = screen.getByRole('switch', { name: 'Donker thema' })
    expect(sw).toHaveAttribute('aria-checked', 'true')
  })

  it('flips checked state on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} aria-label="x" />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('does not fire onChange when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Toggle checked={false} onChange={onChange} disabled aria-label="x" />)
    await user.click(screen.getByRole('switch'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('renders bundled row with label + description when label provided', () => {
    const { container } = render(
      <Toggle
        checked={false}
        onChange={vi.fn()}
        label="Sessieherinneringen"
        description="Stuur een melding."
      />,
    )
    expect(container.querySelector('.toggle-row')).not.toBeNull()
    expect(screen.getByText('Sessieherinneringen')).toHaveClass('toggle-row-label')
    expect(screen.getByText('Stuur een melding.')).toHaveClass('toggle-row-desc')
    // Switch is labelled by the label via aria-labelledby
    const sw = screen.getByRole('switch')
    expect(sw.getAttribute('aria-labelledby')).toBeTruthy()
  })

  it('applies variant + size modifier classes', () => {
    const { container, rerender } = render(
      <Toggle checked={true} onChange={vi.fn()} variant="gold" aria-label="x" />,
    )
    expect(container.querySelector('.toggle')).toHaveClass('toggle-gold')
    rerender(<Toggle checked={true} onChange={vi.fn()} size="sm" aria-label="x" />)
    expect(container.querySelector('.toggle')).toHaveClass('toggle-sm')
  })
})
