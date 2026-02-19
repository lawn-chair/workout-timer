'use client'

import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const devAuthEnabled =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_DEV_AUTH === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-8">Sign in to Workout Timer</h1>
        {devAuthEnabled ? (
          <button
            onClick={() =>
              signIn('credentials', {
                email: 'dev@example.com',
                callbackUrl: '/',
              })
            }
            className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            Continue as Dev User
          </button>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
        )}
      </div>
    </div>
  )
}
