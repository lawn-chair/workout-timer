import Link from 'next/link'
import AppShell from '@/components/ui/AppShell'

export default function OfflinePage() {
  return (
    <AppShell>
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-panel rounded-3xl p-10 max-w-lg text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-lime-300">
            Offline
          </p>
          <h1 className="display-font text-4xl mt-4">Connection paused</h1>
          <p className="text-sm text-gray-400 mt-3">
            You are offline right now. Reconnect to continue syncing workouts or
            return to your library.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link href="/" className="lime-button rounded-full py-3 text-sm">
              Back to dashboard
            </Link>
            <Link
              href="/timer"
              className="ghost-button rounded-full py-3 text-sm"
            >
              Open last workout
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
