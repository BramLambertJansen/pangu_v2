import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Checkbox } from '@/components/ui/Checkbox'

describe('Checkbox', () => {
  it('renders a checkbox role with aria-checked + label', () => {
    render(<Checkbox checked onChange={vi.fn()} label="Magisch item" />)
    const cb = screen.getByRole('checkbox', { name: 'Magisch item' })
    expect(cb).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Magisch item')).toHaveClass('check-label')
  })

  it('renders unchecked state with no glyph', () => {
    const { container } = render(<Checkbox checked={false} onChange={vi.fn()} aria-label="x" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false')
    expect(container.querySelector('.check-box svg')).toBeNull()
  })

  it('flips checked state on click', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} aria-label="x" />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('shows mixed aria-checked when indeterminate', () => {
    render(<Checkbox checked indeterminate onChange={vi.fn()} aria-label="x" />)
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'mixed')
  })

  it('does not fire onChange when disabled', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<Checkbox checked={false} onChange={onChange} disabled aria-label="x" />)
    await user.click(screen.getByRole('checkbox'))
    expect(onChange).not.toHaveBeenCalled()
  })
})
