import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AppShell from './AppShell'

describe('AppShell', () => {
  it('renders children and base class', () => {
    render(
      <AppShell>
        <div>Content</div>
      </AppShell>
    )

    const content = screen.getByText('Content')
    expect(content).toBeInTheDocument()
    expect(content.parentElement).toHaveClass('app-shell')
  })
})
