'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      router.push('/')
    }
  }, [session, router])

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-5">
          <div className="glass-panel rounded-3xl px-8 py-10 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-lime-400/20 text-lime-300 flex items-center justify-center mb-4">
              <IconMark className="h-6 w-6" />
            </div>
            <p className="text-sm text-gray-400">Loading authentication...</p>
          </div>
        </div>
      </AppShell>
    )
  }

  const devAuthEnabled =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEV_AUTH === 'true'

  return (
    <AppShell>
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="glass-panel rounded-3xl px-8 py-10 max-w-lg w-full text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-lime-400/20 text-lime-300 flex items-center justify-center mb-6">
            <IconMark className="h-8 w-8" />
          </div>
          <p className="text-xs uppercase tracking-[0.4em] text-lime-300">
            Welcome Back
          </p>
          <h1 className="display-font text-4xl mt-3">Sign in to train</h1>
          <p className="text-sm text-gray-400 mt-3">
            Access your workouts, settings, and the performance timer.
          </p>
          <div className="mt-8">
            {devAuthEnabled ? (
              <button
                onClick={() =>
                  signIn('credentials', {
                    email: 'dev@example.com',
                    callbackUrl: '/',
                  })
                }
                className="lime-button w-full py-3 rounded-full text-sm"
              >
                Continue as Dev User
              </button>
            ) : (
              <button
                onClick={() => signIn('google', { callbackUrl: '/' })}
                className="lime-button w-full py-3 rounded-full text-sm"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
