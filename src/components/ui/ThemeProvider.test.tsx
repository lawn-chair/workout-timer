import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, useTheme } from '@/components/ui/ThemeProvider'
import { vi, describe, it, expect, beforeEach } from 'vitest'

function TestComponent() {
  const { theme, accessibility, setTheme, setAccessibility } = useTheme()
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="accessibility">{accessibility}</span>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Dark
      </button>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Light
      </button>
      <button
        data-testid="set-high-contrast"
        onClick={() => setAccessibility('high-contrast')}
      >
        High Contrast
      </button>
      <button
        data-testid="set-large-text"
        onClick={() => setAccessibility('large-text')}
      >
        Large Text
      </button>
    </div>
  )
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
    })
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: query === '(prefers-color-scheme: light)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }))
    )
  })

  it('provides default theme and accessibility', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('accessibility')).toHaveTextContent('default')
  })

  it('uses initial values when provided', () => {
    render(
      <ThemeProvider initialTheme="light" initialAccessibility="large-text">
        <TestComponent />
      </ThemeProvider>
    )

    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(screen.getByTestId('accessibility')).toHaveTextContent('large-text')
  })

  it('updates theme when setTheme is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByTestId('set-dark'))
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')

    fireEvent.click(screen.getByTestId('set-light'))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
  })

  it('updates accessibility when setAccessibility is called', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    )

    fireEvent.click(screen.getByTestId('set-high-contrast'))
    expect(screen.getByTestId('accessibility')).toHaveTextContent(
      'high-contrast'
    )

    fireEvent.click(screen.getByTestId('set-large-text'))
    expect(screen.getByTestId('accessibility')).toHaveTextContent('large-text')
  })

  it('throws error when useTheme is used outside provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<TestComponent />)).toThrow(
      'useTheme must be used within a ThemeProvider'
    )
  })
})
