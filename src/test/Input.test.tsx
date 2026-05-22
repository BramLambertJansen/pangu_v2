import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '@/components/ui/Input'

describe('Input', () => {
  it('associates label with input via htmlFor/id', () => {
    render(<Input label="Naam" />)
    const input = screen.getByRole('textbox')
    const label = screen.getByText('Naam')
    expect(label).toHaveAttribute('for', input.id)
  })

  it('uses provided id instead of generated id', () => {
    render(<Input label="Email" id="email-field" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email-field')
    expect(screen.getByText('Email')).toHaveAttribute('for', 'email-field')
  })

  it('sets aria-describedby and aria-invalid when error is provided', () => {
    render(<Input label="Naam" error="Verplicht veld" />)
    const input = screen.getByRole('textbox')
    const errorMsg = screen.getByRole('alert')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', errorMsg.id)
    expect(errorMsg).toHaveTextContent('Verplicht veld')
  })

  it('does not set aria-describedby or aria-invalid when no error', () => {
    render(<Input label="Naam" />)
    const input = screen.getByRole('textbox')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('renders without label', () => {
    render(<Input placeholder="Zoek..." />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.queryByText('label')).toBeNull()
  })
})
