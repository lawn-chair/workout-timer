import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db', () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
    },
  },
}))

describe('auth options', () => {
  it('uses credentials provider in development', async () => {
    vi.stubEnv('NODE_ENV', 'development')

    vi.resetModules()
    const { authOptions } = await import('@/lib/auth')
    const [provider] = authOptions.providers

    expect(provider).toBeTruthy()
    expect(provider?.id).toBe('credentials')

    vi.resetModules()
    vi.unstubAllEnvs()
  })
})
