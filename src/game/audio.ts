import { DEFAULT_SETTINGS } from './constants'

export type SfxName =
  | 'click'
  | 'interact'
  | 'step'
  | 'jump'
  | 'land'
  | 'reward'
  | 'error'
  | 'reveal'
  | 'door'
  | 'buy'
  | 'sleep'
  | 'pickup'

interface AudioEngine {
  ctx: AudioContext
  master: GainNode
  noise: AudioBuffer
}

let engine: AudioEngine | null = null
let volume = DEFAULT_SETTINGS.masterVolume
let muted = DEFAULT_SETTINGS.muted

let ambience: { source: AudioBufferSourceNode; gain: GainNode; timer: number } | null = null

function getContext(): AudioEngine | null {
  if (engine) return engine
  try {
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = muted ? 0 : volume
    master.connect(ctx.destination)

    const length = Math.floor(ctx.sampleRate * 1.2)
    const noise = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = noise.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.2
    }
    engine = { ctx, master, noise }
    return engine
  } catch {
    return null
  }
}

/** Called from the first user gesture so browsers allow playback. */
export function unlockAudio(): void {
  const e = getContext()
  if (!e) return
  if (e.ctx.state === 'suspended') void e.ctx.resume()
}

export function applyAudioSettings(nextVolume: number, nextMuted: boolean): void {
  volume = Math.min(1, Math.max(0, nextVolume))
  muted = nextMuted
  const e = engine
  if (!e) return
  try {
    e.master.gain.setTargetAtTime(muted ? 0 : volume, e.ctx.currentTime, 0.05)
  } catch {
    // ignore
  }
  if (ambience) {
    try {
      ambience.gain.gain.setTargetAtTime(muted ? 0 : 0.06 * volume, e.ctx.currentTime, 0.2)
    } catch {
      // ignore
    }
  }
}

function tone(
  e: AudioEngine,
  opts: {
    freq: number
    endFreq?: number
    duration: number
    type?: OscillatorType
    gain?: number
    delay?: number
  },
): void {
  const { ctx } = e
  const start = ctx.currentTime + (opts.delay ?? 0)
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = opts.type ?? 'sine'
  osc.frequency.setValueAtTime(opts.freq, start)
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.endFreq), start + opts.duration)
  }
  const peak = opts.gain ?? 0.15
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration)
  osc.connect(gain)
  gain.connect(e.master)
  osc.start(start)
  osc.stop(start + opts.duration + 0.03)
}

function noiseBurst(
  e: AudioEngine,
  opts: { duration: number; gain?: number; filter?: number; delay?: number; type?: BiquadFilterType },
): void {
  const { ctx } = e
  const start = ctx.currentTime + (opts.delay ?? 0)
  const source = ctx.createBufferSource()
  source.buffer = e.noise
  const filter = ctx.createBiquadFilter()
  filter.type = opts.type ?? 'lowpass'
  filter.frequency.value = opts.filter ?? 900
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(opts.gain ?? 0.12, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(e.master)
  source.start(start)
  source.stop(start + opts.duration + 0.05)
}

export function playSfx(name: SfxName): void {
  const e = getContext()
  if (!e || muted) return
  if (e.ctx.state === 'suspended') void e.ctx.resume()
  try {
    switch (name) {
      case 'click':
        tone(e, { freq: 620, endFreq: 880, duration: 0.07, type: 'triangle', gain: 0.08 })
        break
      case 'interact':
        tone(e, { freq: 520, endFreq: 780, duration: 0.12, type: 'sine', gain: 0.11 })
        tone(e, { freq: 780, endFreq: 1040, duration: 0.12, type: 'sine', gain: 0.07, delay: 0.08 })
        break
      case 'step':
        noiseBurst(e, { duration: 0.09, gain: 0.05, filter: 420 + Math.random() * 260 })
        break
      case 'jump':
        tone(e, { freq: 300, endFreq: 620, duration: 0.16, type: 'sine', gain: 0.08 })
        break
      case 'land':
        noiseBurst(e, { duration: 0.13, gain: 0.07, filter: 320 })
        break
      case 'reward':
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
          tone(e, { freq: f, duration: 0.26, type: 'triangle', gain: 0.1, delay: i * 0.09 }),
        )
        break
      case 'error':
        tone(e, { freq: 220, endFreq: 130, duration: 0.22, type: 'sawtooth', gain: 0.07 })
        break
      case 'reveal':
        [392, 523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
          tone(e, { freq: f, duration: 0.5, type: 'triangle', gain: 0.11, delay: i * 0.11 }),
        )
        noiseBurst(e, { duration: 0.9, gain: 0.06, filter: 1800, type: 'highpass' })
        break
      case 'door':
        noiseBurst(e, { duration: 0.28, gain: 0.07, filter: 500 })
        tone(e, { freq: 180, endFreq: 120, duration: 0.24, type: 'sine', gain: 0.06 })
        break
      case 'buy':
        tone(e, { freq: 880, duration: 0.1, type: 'square', gain: 0.07 })
        tone(e, { freq: 1318.5, duration: 0.16, type: 'square', gain: 0.06, delay: 0.09 })
        break
      case 'sleep':
        tone(e, { freq: 420, endFreq: 160, duration: 0.9, type: 'sine', gain: 0.08 })
        break
      case 'pickup':
        tone(e, { freq: 740, endFreq: 1180, duration: 0.14, type: 'triangle', gain: 0.09 })
        break
    }
  } catch {
    // sound is best-effort and must never break gameplay
  }
}

export function startAmbience(): void {
  const e = getContext()
  if (!e || ambience) return
  try {
    if (e.ctx.state === 'suspended') void e.ctx.resume()
    const source = e.ctx.createBufferSource()
    source.buffer = e.noise
    source.loop = true
    const filter = e.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = 480
    filter.Q.value = 0.6
    const gain = e.ctx.createGain()
    gain.gain.value = muted ? 0 : 0.06 * volume
    source.connect(filter)
    filter.connect(gain)
    gain.connect(e.master)
    source.start()

    // Sprinkled bird chirps so the campus never sounds dead.
    const timer = globalThis.setInterval(() => {
      if (muted || !engine) return
      const base = 1400 + Math.random() * 900
      tone(engine, { freq: base, endFreq: base * 1.5, duration: 0.09, type: 'sine', gain: 0.03 })
      tone(engine, {
        freq: base * 1.2,
        endFreq: base * 0.9,
        duration: 0.11,
        type: 'sine',
        gain: 0.025,
        delay: 0.12,
      })
    }, 4200)

    ambience = { source, gain, timer }
  } catch {
    // ignore
  }
}

export function stopAmbience(): void {
  if (!ambience) return
  try {
    ambience.source.stop()
    globalThis.clearInterval(ambience.timer)
  } catch {
    // ignore
  }
  ambience = null
}
