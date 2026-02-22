import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'

vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="session-provider">{children}</div>
  ),
}))

describe('AuthProvider', () => {
  it('renders children within session provider', () => {
    render(
      <AuthProvider>
        <div>Child</div>
      </AuthProvider>
    )

    expect(screen.getByTestId('session-provider')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })
})
