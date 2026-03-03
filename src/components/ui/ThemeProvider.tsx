'use client'

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  useContext,
  type ReactNode,
} from 'react'

export type ThemeMode = 'dark' | 'light' | 'system'
export type AccessibilityPreset = 'default' | 'high-contrast' | 'large-text'

interface ThemeContextValue {
  theme: ThemeMode
  accessibility: AccessibilityPreset
  setTheme: (theme: ThemeMode) => void
  setAccessibility: (preset: AccessibilityPreset) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: ReactNode
  initialTheme?: ThemeMode
  initialAccessibility?: AccessibilityPreset
}

function getSystemTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function ThemeProvider({
  children,
  initialTheme = 'system',
  initialAccessibility = 'default',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme)
  const [accessibility, setAccessibilityState] =
    useState<AccessibilityPreset>(initialAccessibility)

  const applyTheme = useCallback(
    (mode: ThemeMode, preset: AccessibilityPreset) => {
      const root = document.documentElement

      let effectiveTheme = mode
      if (mode === 'system') {
        effectiveTheme = getSystemTheme()
      }

      root.setAttribute('data-theme', effectiveTheme)
      root.classList.remove('high-contrast', 'large-text')

      if (preset === 'high-contrast') {
        root.classList.add('high-contrast')
        root.setAttribute('data-theme', 'high-contrast')
      } else if (preset === 'large-text') {
        root.classList.add('large-text')
      }
    },
    []
  )

  useEffect(() => {
    applyTheme(theme, accessibility)
  }, [theme, accessibility, applyTheme])

  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    const handleChange = () => {
      applyTheme('system', accessibility)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, accessibility, applyTheme])

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme)
    try {
      localStorage.setItem('theme', newTheme)
    } catch {
      // localStorage not available
    }
  }, [])

  const setAccessibility = useCallback((newPreset: AccessibilityPreset) => {
    setAccessibilityState(newPreset)
    try {
      localStorage.setItem('accessibility', newPreset)
    } catch {
      // localStorage not available
    }
  }, [])

  return (
    <ThemeContext.Provider
      value={{
        theme,
        accessibility,
        setTheme,
        setAccessibility,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
