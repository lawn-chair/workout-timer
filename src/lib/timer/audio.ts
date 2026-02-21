class AudioManager {
  private ctx: AudioContext | null = null
  private enabled = true

  private getContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()
    }
    return this.ctx
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  unlock() {
    if (!this.enabled) return

    try {
      const ctx = this.getContext()
      if (ctx.state === 'suspended') {
        void ctx.resume()
      }

      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      gain.gain.setValueAtTime(0, ctx.currentTime)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.01)
    } catch (e) {
      console.warn('Audio not available:', e)
    }
  }

  playBeep(frequency = 800, duration = 0.1) {
    if (!this.enabled) return

    try {
      const ctx = this.getContext()
      if (ctx.state === 'suspended') {
        void ctx.resume()
        return
      }
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      gain.gain.setValueAtTime(0.5, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + duration)
    } catch (e) {
      console.warn('Audio not available:', e)
    }
  }

  playCountdown() {
    this.playBeep(800, 0.1)
  }

  playWorkStart() {
    this.playBeep(1000, 0.3)
    setTimeout(() => this.playBeep(1200, 0.3), 150)
  }

  playRestStart() {
    this.playBeep(600, 0.3)
    setTimeout(() => this.playBeep(400, 0.3), 150)
  }

  playComplete() {
    this.playBeep(800, 0.2)
    setTimeout(() => this.playBeep(1000, 0.2), 200)
    setTimeout(() => this.playBeep(1200, 0.4), 400)
  }
}

export const audioManager = new AudioManager()
