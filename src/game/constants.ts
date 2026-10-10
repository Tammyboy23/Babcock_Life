import type { Gender, Lifestyle, LocationId, Settings } from '../types'

export const SAVE_KEY = 'babcock-life-save-v2'

export const STARTING_ALLOWANCE: Record<Lifestyle, number> = {
  NEPO: 500_000,
  LAPO: 50_000,
}

export const LIFESTYLE_INFO: Record<
  Lifestyle,
  { title: string; tagline: string; blurb: string; accent: string; room: string }
> = {
  NEPO: {
    title: 'NEPO',
    tagline: 'Premium Wing',
    blurb:
      'Your folks came through. You start with a fat allowance and a premium room already furnished. Spend wisely — appearances are everything.',
    accent: '#f5c451',
    room: 'Premium double room with AC, mini fridge, rug and wall art.',
  },
  LAPO: {
    title: 'LAPO',
    tagline: 'Hustle Wing',
    blurb:
      'Allowance landed small but your hustle is loud. Manage every naira, stack mission rewards and upgrade your room one piece at a time.',
    accent: '#4ade80',
    room: 'Modest room: bunk mattress, small desk and a plastic chair.',
  },
}

export interface HostelDef {
  id: string
  name: string
  short: string
  gender: Gender
  blurb: string
  accent: string
}

export const HOSTELS: Record<Gender, HostelDef> = {
  boy: {
    id: 'sapphire',
    name: 'Sapphire Hall (Male Wing)',
    short: 'Sapphire Hall',
    gender: 'boy',
    blurb: 'Fictionalised male residence wing, close to the sports centre.',
    accent: '#4f7fc4',
  },
  girl: {
    id: 'amethyst',
    name: 'Amethyst Hall (Female Wing)',
    short: 'Amethyst Hall',
    gender: 'girl',
    blurb: 'Fictionalised female residence wing, a short walk from the library.',
    accent: '#c76d93',
  },
}

/** Hour at which a new day begins after sleeping. */
export const DAY_START_HOUR = 7

/** Minutes an activity costs when nothing else is specified. */
export const DEFAULT_ACTIVITY_MINUTES = 30

/** Cheapest location-to-location hop, in minutes. */
export const BASE_TRAVEL_MINUTES = 8

export const LOCATION_ORDER: LocationId[] = [
  'hostel',
  'cafeteria',
  'lecture',
  'library',
  'sports',
  'shop',
  'hangout',
  'event',
]

export const DEFAULT_SETTINGS: Settings = {
  masterVolume: 0.7,
  muted: false,
  animations: true,
  showTips: true,
}

export const CURRENCY_SYMBOL = '\u20a6'

export function formatMoney(value: number): string {
  return `${CURRENCY_SYMBOL}${Math.round(value).toLocaleString('en-NG')}`
}

/** Shared scene palette per phase so every location changes with the clock. */
export const PHASE_PALETTE: Record<
  string,
  { label: string; sky: [string, string]; glow: string; tint: string; accent: string }
> = {
  Morning: {
    label: 'Morning',
    sky: ['#7ec8e3', '#dff3ff'],
    glow: 'rgba(255, 240, 200, 0.55)',
    tint: 'rgba(255, 236, 200, 0.12)',
    accent: '#facc15',
  },
  Afternoon: {
    label: 'Afternoon',
    sky: ['#5cb0e0', '#bfe6ff'],
    glow: 'rgba(255, 240, 190, 0.35)',
    tint: 'rgba(255, 226, 170, 0.06)',
    accent: '#fb923c',
  },
  Evening: {
    label: 'Evening',
    sky: ['#f38b62', '#ffd9a0'],
    glow: 'rgba(255, 176, 120, 0.5)',
    tint: 'rgba(255, 160, 100, 0.16)',
    accent: '#f97316',
  },
  Night: {
    label: 'Night',
    sky: ['#131a3a', '#2b3a6b'],
    glow: 'rgba(148, 163, 255, 0.35)',
    tint: 'rgba(30, 41, 92, 0.4)',
    accent: '#818cf8',
  },
}
