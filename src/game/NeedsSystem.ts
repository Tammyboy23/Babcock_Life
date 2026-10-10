import type { NeedKey, Needs } from '../types'

export const NEED_KEYS: NeedKey[] = ['hunger', 'energy', 'hygiene', 'happiness', 'social', 'academic']

export interface NeedMeta {
  key: NeedKey
  label: string
  icon: string
  from: string
  to: string
  /** Plain-language explanation of how the need moves. */
  blurb: string
}

export const NEED_META: Record<NeedKey, NeedMeta> = {
  hunger: {
    key: 'hunger',
    label: 'Hunger',
    icon: 'utensils',
    from: '#f59e0b',
    to: '#fbbf24',
    blurb: 'Falls as the day goes on. Eat at the food court to top it up.',
  },
  energy: {
    key: 'energy',
    label: 'Energy',
    icon: 'battery',
    from: '#10b981',
    to: '#6ee7b7',
    blurb: 'Spent by lectures, jobs and sports. Sleep or nap to restore it.',
  },
  hygiene: {
    key: 'hygiene',
    label: 'Hygiene',
    icon: 'droplets',
    from: '#38bdf8',
    to: '#a5f3fc',
    blurb: 'Shower in your room. Low hygiene makes people less receptive.',
  },
  happiness: {
    key: 'happiness',
    label: 'Happiness',
    icon: 'smile',
    from: '#ec4899',
    to: '#f9a8d4',
    blurb: 'Raised by friends, events and sport. Low mood dulls your studying.',
  },
  social: {
    key: 'social',
    label: 'Social',
    icon: 'users',
    from: '#8b5cf6',
    to: '#c4b5fd',
    blurb: 'Grows through conversation and hangouts. Isolation drains it.',
  },
  academic: {
    key: 'academic',
    label: 'Academic',
    icon: 'graduation-cap',
    from: '#6366f1',
    to: '#a5b4fc',
    blurb: 'Built by lectures, library sessions and study groups.',
  },
}

/** Per in-game hour decay rates while the player is awake. */
const DECAY_PER_HOUR: Record<NeedKey, number> = {
  hunger: 6,
  energy: 3,
  hygiene: 2.4,
  happiness: 1.1,
  social: 1.9,
  academic: 0.7,
}

/** Per in-game hour decay while asleep. */
const SLEEP_DECAY_PER_HOUR: Record<NeedKey, number> = {
  hunger: 4,
  energy: -14, // negative decay = recovery
  hygiene: 1.4,
  happiness: 0.2,
  social: 0.6,
  academic: 0.4,
}

export function fullNeeds(): Needs {
  return { hunger: 80, energy: 100, hygiene: 80, happiness: 70, social: 60, academic: 50 }
}

export function clampNeed(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function clampNeeds(needs: Needs): Needs {
  return {
    hunger: clampNeed(needs.hunger),
    energy: clampNeed(needs.energy),
    hygiene: clampNeed(needs.hygiene),
    happiness: clampNeed(needs.happiness),
    social: clampNeed(needs.social),
    academic: clampNeed(needs.academic),
  }
}

export function applyNeedDeltas(needs: Needs, deltas: Partial<Needs>): Needs {
  const next: Needs = { ...needs }
  for (const key of NEED_KEYS) {
    const delta = deltas[key]
    if (delta !== undefined) next[key] = clampNeed(next[key] + delta)
  }
  return next
}

/**
 * Starving students get less out of food, low hygiene sours conversations and a
 * bad mood halves what you actually learn. Kept mild on purpose.
 */
export function energyGainMultiplier(needs: Needs): number {
  return needs.hunger < 20 ? 0.5 : 1
}

export function socialGainMultiplier(needs: Needs): number {
  return needs.hygiene < 20 ? 0.6 : 1
}

export function academicGainMultiplier(needs: Needs): number {
  return needs.happiness < 25 ? 0.6 : 1
}

export function decayNeeds(needs: Needs, minutes: number, asleep = false): Needs {
  const hours = minutes / 60
  const rates = asleep ? SLEEP_DECAY_PER_HOUR : DECAY_PER_HOUR
  const next: Needs = { ...needs }
  for (const key of NEED_KEYS) {
    next[key] = clampNeed(next[key] - rates[key] * hours)
  }
  // A miserable student also loses social appetite faster.
  if (next.happiness < 20 && !asleep) {
    next.social = clampNeed(next.social - hours * 1.2)
  }
  return next
}

/** Human-readable list of the consequences currently in force. */
export function needsWarnings(needs: Needs): string[] {
  const warnings: string[] = []
  if (needs.hunger < 20) warnings.push('Very hungry — meals restore only half their usual energy.')
  if (needs.energy < 20) warnings.push('Exhausted — sleep, nap or eat before big activities.')
  if (needs.hygiene < 20) warnings.push('Unwashed — conversations gain 40% less goodwill.')
  if (needs.happiness < 25) warnings.push('Low mood — studying and lectures are 40% less effective.')
  if (needs.social < 20) warnings.push('Isolated — happiness is dropping faster than usual.')
  if (needs.academic < 25) warnings.push('Academics slipping — visit the library or a lecture.')
  return warnings
}

export function moodLabel(needs: Needs): { label: string; tone: string } {
  const score =
    (needs.hunger + needs.energy + needs.hygiene + needs.happiness + needs.social + needs.academic) / 6
  if (score >= 80) return { label: 'Thriving', tone: '#4ade80' }
  if (score >= 62) return { label: 'Doing well', tone: '#a3e635' }
  if (score >= 45) return { label: 'Managing', tone: '#facc15' }
  if (score >= 28) return { label: 'Struggling', tone: '#fb923c' }
  return { label: 'Running on fumes', tone: '#f87171' }
}

export function lowestNeeds(needs: Needs, count = 2): NeedKey[] {
  return [...NEED_KEYS].sort((a, b) => needs[a] - needs[b]).slice(0, count)
}
