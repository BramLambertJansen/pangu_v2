import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RadioGroup, Radio } from '@/components/ui/Radio'

function Setup({ initial = 'a', disabled = false }: { initial?: string; disabled?: boolean } = {}) {
  const onChange = vi.fn()
  const result = render(
    <RadioGroup value={initial} onChange={onChange} label="Test groep">
      <Radio value="a" label="Eerste" />
      <Radio value="b" label="Tweede" description="Met sub-tekst" />
      <Radio value="c" label="Derde" disabled={disabled} />
    </RadioGroup>,
  )
  return { ...result, onChange }
}

describe('RadioGroup + Radio', () => {
  it('renders a radiogroup with three radio buttons', () => {
    Setup()
    expect(screen.getByRole('radiogroup', { name: 'Test groep' })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
  })

  it('marks the initial value as checked', () => {
    Setup({ initial: 'b' })
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('renders description (radio-sub) when provided', () => {
    Setup()
    expect(screen.getByText('Met sub-tekst')).toHaveClass('radio-sub')
  })

  it('calls onChange with the clicked value', async () => {
    const user = userEvent.setup()
    const { onChange } = Setup({ initial: 'a' })
    await user.click(screen.getByRole('radio', { name: /Tweede/ }))
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('ignores clicks on a disabled radio', async () => {
    const user = userEvent.setup()
    const { onChange } = Setup({ initial: 'a', disabled: true })
    await user.click(screen.getByRole('radio', { name: 'Derde' }))
    expect(onChange).not.toHaveBeenCalled()
  })
})
