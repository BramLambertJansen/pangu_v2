import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { FormField } from '@/components/ui/FormField'
import { SegmentedControl } from '@/components/ui/SegmentedControl'
import { NumberStepper } from '@/components/ui/NumberStepper'

describe('Select', () => {
  it('associates label and renders options from the options prop', () => {
    render(
      <Select
        label="Status"
        options={[
          { value: 'draft', label: 'Concept' },
          { value: 'active', label: 'Actief' },
        ]}
      />,
    )
    const select = screen.getByRole('combobox')
    expect(screen.getByText('Status')).toHaveAttribute('for', select.id)
    expect(screen.getByRole('option', { name: 'Concept' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Actief' })).toBeInTheDocument()
  })

  it('wires aria-invalid + aria-describedby on error', () => {
    render(<Select label="Status" error="Kies een status" options={[{ value: 'a', label: 'A' }]} />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-invalid', 'true')
    expect(select).toHaveAttribute('aria-describedby', screen.getByRole('alert').id)
  })
})

describe('Textarea', () => {
  it('associates label with the textarea', () => {
    render(<Textarea label="Beschrijving" />)
    const area = screen.getByRole('textbox')
    expect(screen.getByText('Beschrijving')).toHaveAttribute('for', area.id)
  })
})

describe('FormField', () => {
  it('shows hint only when there is no error', () => {
    const { rerender } = render(
      <FormField label="Naam" htmlFor="x" hint="Een tip">
        <input id="x" />
      </FormField>,
    )
    expect(screen.getByText('Een tip')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()

    rerender(
      <FormField label="Naam" htmlFor="x" hint="Een tip" error="Fout">
        <input id="x" />
      </FormField>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Fout')
    expect(screen.queryByText('Een tip')).toBeNull()
  })
})

describe('SegmentedControl', () => {
  const opts = [
    { value: 'a', label: 'A' },
    { value: 'b', label: 'B' },
    { value: 'c', label: 'C' },
  ]

  it('exposes a radiogroup with the checked option', () => {
    render(<SegmentedControl label="Weergave" value="a" options={opts} onChange={() => {}} />)
    expect(screen.getByRole('radiogroup', { name: 'Weergave' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: 'A' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'false')
  })

  it('moves selection with arrow keys', () => {
    const onChange = vi.fn()
    render(<SegmentedControl label="Weergave" value="a" options={opts} onChange={onChange} />)
    fireEvent.keyDown(screen.getByRole('radio', { name: 'A' }), { key: 'ArrowRight' })
    expect(onChange).toHaveBeenCalledWith('b')
  })
})

describe('NumberStepper', () => {
  it('increments and decrements within bounds', () => {
    const onChange = vi.fn()
    render(<NumberStepper label="HP" value={5} min={0} max={10} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'HP verhogen' }))
    expect(onChange).toHaveBeenCalledWith(6)
    fireEvent.click(screen.getByRole('button', { name: 'HP verlagen' }))
    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('disables the decrement button at min', () => {
    render(<NumberStepper label="HP" value={0} min={0} max={10} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'HP verlagen' })).toBeDisabled()
  })
})
