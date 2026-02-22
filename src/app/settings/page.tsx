'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchUserSettings, updateUserSettings } from '@/lib/workout/api'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'
import StatePanel from '@/components/ui/StatePanel'

interface UserSettings {
  countdownBeeps: boolean
  workStartSound: boolean
  restStartSound: boolean
  completionChime: boolean
}

const defaultSettings: UserSettings = {
  countdownBeeps: true,
  workStartSound: true,
  restStartSound: true,
  completionChime: true,
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [settings, setSettings] = useState<UserSettings>(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    if (status === 'authenticated') {
      fetchUserSettings()
        .then((data) => {
          setSettings({
            ...defaultSettings,
            ...(data as Partial<UserSettings>),
          })
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status, router])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateUserSettings(settings as unknown as Record<string, unknown>)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof UserSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (status === 'loading' || loading) {
    return (
      <AppShell>
        <div className="min-h-screen flex items-center justify-center px-5">
          <StatePanel
            eyebrow="Loading"
            title="Syncing settings"
            description="Pulling your preferences."
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="min-h-screen">
        <header className="border-b border-white/5 bg-black/30">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-lime-400/20 text-lime-300 flex items-center justify-center">
                <IconMark className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-lime-300/80">
                  Preferences
                </p>
                <h1 className="display-font text-3xl">Settings</h1>
              </div>
            </div>
            <Link
              href="/"
              className="ghost-button px-4 py-2 rounded-full text-sm"
            >
              Back
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-5 py-8 space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-2">Account</h2>
            <div className="glass-panel rounded-2xl p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Name</span>
                <span className="flex items-center gap-2">
                  {session?.user?.image ? (
                    <Image
                      src={session.user.image}
                      alt="User avatar"
                      width={24}
                      height={24}
                      className="h-6 w-6 rounded-full object-cover border border-white/10"
                    />
                  ) : (
                    <span
                      className="h-6 w-6 rounded-full bg-white/10 text-[0.55rem] uppercase tracking-wide text-white/70 flex items-center justify-center"
                      aria-label="User avatar"
                    >
                      {(session?.user?.name || 'User').slice(0, 2)}
                    </span>
                  )}
                  <span>{session?.user?.name || 'N/A'}</span>
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Email</span>
                <span>{session?.user?.email || 'N/A'}</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Audio Preferences</h2>
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              {[
                {
                  key: 'countdownBeeps' as const,
                  label: 'Countdown Beeps',
                  desc: '3-2-1 beeps before exercise starts',
                },
                {
                  key: 'workStartSound' as const,
                  label: 'Work Start Sound',
                  desc: 'Chime when work phase begins',
                },
                {
                  key: 'restStartSound' as const,
                  label: 'Rest Start Sound',
                  desc: 'Chime when rest phase begins',
                },
                {
                  key: 'completionChime' as const,
                  label: 'Completion Chime',
                  desc: 'Sound when workout is complete',
                },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-sm text-gray-400">{desc}</p>
                  </div>
                  <button
                    onClick={() => toggleSetting(key)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings[key] ? 'bg-lime-400' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings[key] ? 'translate-x-6' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full lime-button disabled:bg-gray-600 py-3 rounded-full font-medium"
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </main>
      </div>
    </AppShell>
  )
}
