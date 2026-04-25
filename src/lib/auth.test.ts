import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

describe('auth options', () => {
  it('includes google provider outside dev auth', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('E2E_TESTING', 'false')
    vi.stubEnv('DEV_AUTH', 'false')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-client-secret')

    vi.resetModules()
    const { authOptions } = await import('@/lib/auth')
    const ids = authOptions.providers.map((provider) => provider.id)

    expect(ids).toContain('google')

    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('uses credentials provider in development with dev auth enabled', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DEV_AUTH', 'true')

    vi.resetModules()
    const { authOptions } = await import('@/lib/auth')
    const [provider] = authOptions.providers

    expect(provider).toBeTruthy()
    expect(provider?.id).toBe('credentials')

    vi.resetModules()
    vi.unstubAllEnvs()
  })

  it('does not use credentials provider in development without explicit dev auth flag', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('DEV_AUTH', 'false')
    vi.stubEnv('E2E_TESTING', 'false')
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id')
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-client-secret')

    vi.resetModules()
    const { authOptions } = await import('@/lib/auth')
    const ids = authOptions.providers.map((provider) => provider.id)

    expect(ids).toContain('google')
    expect(ids).not.toContain('credentials')

    vi.resetModules()
    vi.unstubAllEnvs()
  })
})
