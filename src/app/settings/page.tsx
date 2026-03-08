'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchUserSettings, updateUserSettings } from '@/lib/workout/api'
import { type Settings, defaultSettings } from '@/lib/settings'
import AppShell from '@/components/ui/AppShell'
import IconMark from '@/components/ui/IconMark'
import StatePanel from '@/components/ui/StatePanel'
import {
  useTheme,
  type ThemeMode,
  type AccessibilityPreset,
} from '@/components/ui/ThemeProvider'

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  )
}

function SettingsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { theme, accessibility, setTheme, setAccessibility } = useTheme()
  const [settings, setSettings] = useState<Settings>(defaultSettings)
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
            ...data,
            theme: data.theme || theme,
            accessibility: data.accessibility || accessibility,
          })
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [status, router, theme, accessibility])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await updateUserSettings(settings)
      if (settings.theme) {
        setTheme(settings.theme)
      }
      if (settings.accessibility) {
        setAccessibility(settings.accessibility)
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key: keyof Settings) => {
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

          <section>
            <h2 className="text-lg font-semibold mb-2">Appearance</h2>
            <div className="glass-panel rounded-2xl p-5 space-y-4">
              <div>
                <p className="font-medium mb-2">Theme</p>
                <div className="flex gap-2">
                  {[
                    { value: 'dark', label: 'Dark' },
                    { value: 'light', label: 'Light' },
                    { value: 'system', label: 'System' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          theme: value as ThemeMode,
                        }))
                      }
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        settings.theme === value
                          ? 'bg-lime-400 text-black'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-medium mb-2">Accessibility</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'default', label: 'Default' },
                    { value: 'high-contrast', label: 'High Contrast' },
                    { value: 'large-text', label: 'Large Text' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() =>
                        setSettings((prev) => ({
                          ...prev,
                          accessibility: value as AccessibilityPreset,
                        }))
                      }
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        settings.accessibility === value
                          ? 'bg-lime-400 text-black'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
