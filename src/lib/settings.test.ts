import { describe, it, expect } from 'vitest'
import { defaultSettings, parseSettings, type Settings } from './settings'

describe('settings', () => {
  describe('defaultSettings', () => {
    it('enables all audio cues and follows the system theme', () => {
      expect(defaultSettings).toEqual({
        countdownBeeps: true,
        workStartSound: true,
        restStartSound: true,
        completionChime: true,
        theme: 'system',
        accessibility: 'default',
      })
    })
  })

  describe('parseSettings', () => {
    it('round-trips a fully specified valid settings object', () => {
      const settings: Settings = {
        countdownBeeps: false,
        workStartSound: false,
        restStartSound: true,
        completionChime: false,
        theme: 'dark',
        accessibility: 'high-contrast',
      }

      expect(parseSettings(settings)).toEqual(settings)
    })

    it.each([null, undefined])('returns defaults for %s', (raw) => {
      expect(parseSettings(raw)).toEqual(defaultSettings)
    })

    it('returns defaults for an empty object', () => {
      expect(parseSettings({})).toEqual(defaultSettings)
    })

    it('fills missing fields from defaults and keeps provided ones', () => {
      expect(parseSettings({ theme: 'light', countdownBeeps: false })).toEqual({
        ...defaultSettings,
        theme: 'light',
        countdownBeeps: false,
      })
    })

    it.each(['dark', 'light', 'system'] as const)(
      'accepts theme %s',
      (theme) => {
        expect(parseSettings({ theme }).theme).toBe(theme)
      }
    )

    it.each(['default', 'high-contrast', 'large-text'] as const)(
      'accepts accessibility mode %s',
      (accessibility) => {
        expect(parseSettings({ accessibility }).accessibility).toBe(
          accessibility
        )
      }
    )

    it('drops unknown keys', () => {
      const parsed = parseSettings({ theme: 'dark', isAdmin: true })
      expect(parsed).not.toHaveProperty('isAdmin')
    })

    it.each(['not json', 42, true, [], () => {}])(
      'never throws on garbage input (%s) and returns valid settings',
      (raw) => {
        expect(() => parseSettings(raw)).not.toThrow()
        expect(parseSettings(raw)).toEqual(defaultSettings)
      }
    )

    it('returns valid settings when a field has the wrong type', () => {
      const parsed = parseSettings({ theme: 'neon' })
      expect(['dark', 'light', 'system']).toContain(parsed.theme)
    })
  })
})
