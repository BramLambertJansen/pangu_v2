import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { OrnateDivider } from '@/components/ui/OrnateDivider'

describe('OrnateDivider', () => {
  it('renders separator with no label by default', () => {
    const { container } = render(<OrnateDivider />)
    const sep = container.querySelector('[role="separator"]')
    expect(sep).not.toBeNull()
    expect(container.querySelector('.glyph')).toBeNull()
  })

  it('renders glyph label flanked by default ❋ character', () => {
    const { container } = render(<OrnateDivider label="Mijn Werelden" />)
    const glyph = container.querySelector('.glyph')
    expect(glyph?.textContent?.trim()).toBe('❋ Mijn Werelden ❋')
  })

  it('uses custom glyph when provided', () => {
    const { container } = render(<OrnateDivider label="Arcaan" glyph="✦" />)
    expect(container.querySelector('.glyph')?.textContent?.trim()).toBe('✦ Arcaan ✦')
  })

  it('applies tone modifier classes', () => {
    const { container, rerender } = render(<OrnateDivider label="X" tone="violet" />)
    expect(container.querySelector('.div-ornate')).toHaveClass('div-ornate-violet')
    rerender(<OrnateDivider label="X" tone="muted" />)
    expect(container.querySelector('.div-ornate')).toHaveClass('div-ornate-muted')
  })

  it('applies compact modifier class', () => {
    const { container } = render(<OrnateDivider compact label="X" />)
    expect(container.querySelector('.div-ornate')).toHaveClass('div-ornate-compact')
  })
})
