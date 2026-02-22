import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import StatePanel from './StatePanel'

describe('StatePanel', () => {
  it('renders eyebrow, title, and description', () => {
    render(
      <StatePanel eyebrow="Loading" title="Title" description="Description" />
    )

    expect(screen.getByText('Loading')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('renders action slot', () => {
    render(<StatePanel title="Title" action={<button>Action</button>} />)

    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('applies error tone styles', () => {
    render(<StatePanel title="Title" tone="error" />)

    const title = screen.getByText('Title')
    expect(title.closest('div')).toHaveClass('border')
  })
})
