'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { fetchUserSettings, updateUserSettings } from '@/lib/workout/api'

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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-4 border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Link
            href="/"
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
          >
            Back
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-2">Account</h2>
          <div className="bg-gray-800 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Name</span>
              <span>{session?.user?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Email</span>
              <span>{session?.user?.email || 'N/A'}</span>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">Audio Preferences</h2>
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
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
                    settings[key] ? 'bg-green-500' : 'bg-gray-600'
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
          className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-600 py-3 rounded-lg font-medium"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </main>
    </div>
  )
}
