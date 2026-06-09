import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Modal } from '@/components/ui/Modal'

function setup(open = true, onClose = vi.fn()) {
  render(
    <Modal open={open} onClose={onClose} title="Test modal">
      <button>Eerste</button>
      <button>Tweede</button>
    </Modal>,
  )
  return { onClose }
}

describe('Modal', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('renders nothing when closed', () => {
    render(<Modal open={false} onClose={vi.fn()} title="x"><span /></Modal>)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders dialog with correct title when open', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('Test modal')).toBeInTheDocument()
  })

  it('focuses dialog container on open', () => {
    setup()
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup()
    const { onClose } = setup()
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup()
    const { onClose } = setup()
    // The backdrop is the element with the fixed-inset overlay class.
    // Clicking outside the dialog panel (directly on the backdrop div) should close.
    const backdrop = document.querySelector('.fixed.inset-0') as HTMLElement
    await user.pointer({ target: backdrop, keys: '[MouseLeft]', coords: { clientX: 1, clientY: 1 } })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('restores focus to the previously focused element when closed', async () => {
    const trigger = document.createElement('button')
    trigger.textContent = 'Open'
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { rerender } = render(
      <Modal open={true} onClose={vi.fn()} title="x"><button>Child</button></Modal>,
    )

    // Close the modal
    rerender(<Modal open={false} onClose={vi.fn()} title="x"><button>Child</button></Modal>)
    expect(document.activeElement).toBe(trigger)
  })

  it('wraps focus from last to first focusable element on Tab', async () => {
    const user = userEvent.setup()
    setup()

    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const lastButton = buttons[buttons.length - 1]
    lastButton.focus()
    expect(document.activeElement).toBe(lastButton)

    // Tab from last should wrap to first focusable (which is the close button rendered first)
    await user.tab()
    const firstFocusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )[0]
    expect(document.activeElement).toBe(firstFocusable)
  })

  it('wraps focus from first to last focusable element on Shift+Tab', async () => {
    const user = userEvent.setup()
    setup()

    const dialog = screen.getByRole('dialog')
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const firstFocusable = focusable[0]
    firstFocusable.focus()

    await user.tab({ shift: true })
    const lastFocusable = focusable[focusable.length - 1]
    expect(document.activeElement).toBe(lastFocusable)
  })

  it('renders footer when provided and omits it otherwise', () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="x" footer={<button>Confirm</button>}>
        body
      </Modal>,
    )
    expect(document.querySelector('.modal-foot')).not.toBeNull()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()

    rerender(
      <Modal open onClose={vi.fn()} title="x">body</Modal>,
    )
    expect(document.querySelector('.modal-foot')).toBeNull()
  })

  it('applies size modifier class', () => {
    const { rerender } = render(
      <Modal open onClose={vi.fn()} title="x" size="sm">body</Modal>,
    )
    expect(document.querySelector('.modal')).toHaveClass('modal-sm')
    rerender(<Modal open onClose={vi.fn()} title="x" size="lg">body</Modal>)
    expect(document.querySelector('.modal')).toHaveClass('modal-lg')
  })
})
