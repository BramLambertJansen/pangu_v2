import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ConstellationAtlas } from '@/components/location/ConstellationAtlas'

const markers = [
  { id: 'a', name: 'Stad Vael', x: 20, y: 30, location_type: 'Stad' },
  { id: 'b', name: 'De Grot', x: 70, y: 60, location_type: 'Grot' },
]

describe('ConstellationAtlas', () => {
  it('exposes the map as a labeled group, never a button (no nested interactive)', () => {
    render(<ConstellationAtlas campaignId="c1" mapImageUrl="https://example.com/map.png" markers={markers} pinMode />)

    // The container must not advertise button semantics: it wraps real <button>
    // pins and cannot be keyboard-activated.
    expect(screen.queryByRole('button', { name: /pin te plaatsen/i })).toBeNull()

    const group = screen.getByRole('group', { name: /locatiekaart/i })
    expect(group).toBeInTheDocument()
  })

  it('renders each marker as its own accessible button', () => {
    const onSelect = vi.fn()
    render(<ConstellationAtlas campaignId="c1" mapImageUrl="https://example.com/map.png" markers={markers} onSelect={onSelect} />)

    expect(screen.getByRole('button', { name: 'Stad Vael' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'De Grot' })).toBeInTheDocument()
  })

  it('selecting a pin does not bubble into the container handler', async () => {
    const onSelect = vi.fn()
    const onPlacePin = vi.fn()
    render(
      <ConstellationAtlas
        campaignId="c1"
        mapImageUrl="https://example.com/map.png"
        markers={markers}
        onSelect={onSelect}
        onPlacePin={onPlacePin}
        pinMode
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Stad Vael' }))
    expect(onSelect).toHaveBeenCalledWith('a')
    expect(onPlacePin).not.toHaveBeenCalled()
  })
})
