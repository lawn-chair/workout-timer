import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import IconMark from './IconMark'

describe('IconMark', () => {
  it('renders svg with accessible label', () => {
    render(<IconMark className="h-4 w-4" />)

    const icon = screen.getByRole('img', { name: 'App mark' })
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveAttribute('viewBox', '0 0 64 64')
  })
})
