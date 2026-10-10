import type {
  Clock,
  FurnitureSlot,
  Gender,
  Lifestyle,
  LocationId,
  MissionProgress,
  Needs,
  PlayerProfile,
  SaveData,
  SaveStats,
  Settings,
} from '../types'
import { DAY_START_HOUR, DEFAULT_SETTINGS, HOSTELS, LOCATION_ORDER, SAVE_KEY, STARTING_ALLOWANCE } from './constants'
import { STARTER_FURNITURE, STARTER_OUTFIT } from './EconomySystem'
import { initialMissionState } from './MissionSystem'
import { fullNeeds } from './NeedsSystem'
import { NPC_BY_ID } from './npcs'

export const SAVE_VERSION = 2

/** 50/50 roll, decided once per new game and then stored forever. */
export function rollLifestyle(): Lifestyle {
  try {
    const buffer = new Uint32Array(1)
    globalThis.crypto.getRandomValues(buffer)
    return buffer[0] % 2 === 0 ? 'NEPO' : 'LAPO'
  } catch {
    return Math.random() < 0.5 ? 'NEPO' : 'LAPO'
  }
}

export function emptyStats(): SaveStats {
  return {
    npcsTalked: [],
    locationsVisited: ['hostel'],
    furniturePurchased: 0,
    mealsBought: 0,
    studySessions: 0,
    lecturesAttended: 0,
    jobsDone: 0,
    hangouts: 0,
    giftsGiven: 0,
    nightsSlept: 0,
    scheduleChecked: false,
    eventsExperienced: 0,
    recentEvents: [],
    daysPlayed: 1,
    lastDay: 1,
    jobDay: 0,
    jobsToday: 0,
    lastWorkoutDay: 0,
  }
}

export function startingClock(): Clock {
  return { day: 1, hour: DAY_START_HOUR + 1 }
}

export function createNewSave(profile: PlayerProfile, forcedLifestyle?: Lifestyle): SaveData {
  const lifestyle = forcedLifestyle ?? rollLifestyle()
  const hostel = HOSTELS[profile.gender]
  const now = Date.now()
  return {
    version: SAVE_VERSION,
    createdAt: now,
    updatedAt: now,
    profile,
    gender: profile.gender,
    lifestyle,
    hostelId: hostel.id,
    hostelName: hostel.name,
    balance: STARTING_ALLOWANCE[lifestyle],
    allowanceGranted: true,
    equipment: {
      outfitId: STARTER_OUTFIT,
      furniture: { ...STARTER_FURNITURE[lifestyle] },
    },
    inventory: [STARTER_OUTFIT],
    missions: initialMissionState(),
    stats: emptyStats(),
    settings: { ...DEFAULT_SETTINGS },
    needs: fullNeeds(),
    relationships: {},
    locationId: 'hostel',
    clock: startingClock(),
    revealSeen: false,
  }
}

// ------------------------------------------------------------------ validation

const GENDERS: Gender[] = ['boy', 'girl']
const LIFESTYLES: Lifestyle[] = ['NEPO', 'LAPO']
const NEED_KEYS: (keyof Needs)[] = ['hunger', 'energy', 'hygiene', 'happiness', 'social', 'academic']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, value))
}

function sanitizeSettings(value: unknown): Settings {
  if (!isRecord(value)) return { ...DEFAULT_SETTINGS }
  return {
    masterVolume: clampNumber(value.masterVolume, DEFAULT_SETTINGS.masterVolume, 0, 1),
    muted: typeof value.muted === 'boolean' ? value.muted : DEFAULT_SETTINGS.muted,
    animations: typeof value.animations === 'boolean' ? value.animations : DEFAULT_SETTINGS.animations,
    showTips: typeof value.showTips === 'boolean' ? value.showTips : DEFAULT_SETTINGS.showTips,
  }
}

function sanitizeNeeds(value: unknown): Needs {
  const base = fullNeeds()
  if (!isRecord(value)) return base
  for (const key of NEED_KEYS) {
    base[key] = clampNumber(value[key], base[key], 0, 100)
  }
  return base
}

function sanitizeClock(value: unknown): Clock {
  if (!isRecord(value)) return startingClock()
  return {
    day: Math.round(clampNumber(value.day, 1, 1, 99_999)),
    hour: clampNumber(value.hour, DAY_START_HOUR, 0, 23.999),
  }
}

function sanitizeLocation(value: unknown): LocationId {
  return LOCATION_ORDER.includes(value as LocationId) ? (value as LocationId) : 'hostel'
}

function sanitizeMissions(value: unknown): Record<string, MissionProgress> {
  const base = initialMissionState()
  if (!isRecord(value)) return base
  for (const [id, entry] of Object.entries(value)) {
    if (!base[id]) continue
    if (!isRecord(entry)) continue
    const status = entry.status
    if (status !== 'locked' && status !== 'available' && status !== 'active' && status !== 'completed')
      continue
    base[id] = {
      status,
      counter: clampNumber(entry.counter, 0, 0, 99),
      completedAt: typeof entry.completedAt === 'number' ? entry.completedAt : undefined,
    }
  }
  return base
}

function sanitizeFurniture(value: unknown): Partial<Record<FurnitureSlot, string>> {
  if (!isRecord(value)) return {}
  const out: Partial<Record<FurnitureSlot, string>> = {}
  for (const [slot, item] of Object.entries(value)) {
    if (typeof item === 'string') out[slot as FurnitureSlot] = item
  }
  return out
}

function sanitizeRelationships(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {}
  const out: Record<string, number> = {}
  for (const [npcId, score] of Object.entries(value)) {
    if (!NPC_BY_ID[npcId]) continue
    out[npcId] = Math.round(clampNumber(score, 0, 0, 100))
  }
  return out
}

function sanitizeStats(value: unknown): SaveStats {
  const stats = isRecord(value) ? value : {}
  const locations = asStringArray(stats.locationsVisited).filter((id) =>
    LOCATION_ORDER.includes(id as LocationId),
  )
  if (!locations.includes('hostel')) locations.push('hostel')
  return {
    ...emptyStats(),
    npcsTalked: asStringArray(stats.npcsTalked).filter((id) => Boolean(NPC_BY_ID[id])),
    locationsVisited: locations,
    furniturePurchased: clampNumber(stats.furniturePurchased, 0, 0, 99),
    mealsBought: clampNumber(stats.mealsBought, 0, 0, 9_999),
    studySessions: clampNumber(stats.studySessions, 0, 0, 9_999),
    lecturesAttended: clampNumber(stats.lecturesAttended, 0, 0, 9_999),
    jobsDone: clampNumber(stats.jobsDone, 0, 0, 9_999),
    hangouts: clampNumber(stats.hangouts, 0, 0, 9_999),
    giftsGiven: clampNumber(stats.giftsGiven, 0, 0, 9_999),
    nightsSlept: clampNumber(stats.nightsSlept, 0, 0, 9_999),
    scheduleChecked: stats.scheduleChecked === true,
    eventsExperienced: clampNumber(stats.eventsExperienced, 0, 0, 9_999),
    recentEvents: asStringArray(stats.recentEvents).slice(0, 6),
    daysPlayed: clampNumber(stats.daysPlayed, 1, 1, 99_999),
    lastDay: clampNumber(stats.lastDay, 1, 1, 99_999),
    jobDay: clampNumber(stats.jobDay, 0, 0, 99_999),
    jobsToday: clampNumber(stats.jobsToday, 0, 0, 9),
    lastWorkoutDay: clampNumber(stats.lastWorkoutDay, 0, 0, 99_999),
  }
}

/**
 * Parses untrusted localStorage data into a valid save, or null when it cannot
 * be trusted. Legacy v1 saves (from the free-roam build) migrate cleanly.
 */
export function parseSave(raw: string | null): SaveData | null {
  if (!raw) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }
  if (!isRecord(parsed)) return null
  const profile = parsed.profile
  if (!isRecord(profile)) return null
  if (typeof profile.name !== 'string' || profile.name.trim().length === 0) return null
  const gender = profile.gender
  if (gender !== 'boy' && gender !== 'girl') return null

  const lifestyle = LIFESTYLES.includes(parsed.lifestyle as Lifestyle)
    ? (parsed.lifestyle as Lifestyle)
    : rollLifestyle()

  const equipment = isRecord(parsed.equipment) ? parsed.equipment : {}
  const outfitId = typeof equipment.outfitId === 'string' ? equipment.outfitId : STARTER_OUTFIT
  const inventory = asStringArray(parsed.inventory)
  if (!inventory.includes(outfitId)) inventory.push(outfitId)

  const safeGender: Gender = GENDERS.includes(gender as Gender) ? (gender as Gender) : 'boy'
  const hostel = HOSTELS[safeGender]
  // Legacy saves (v1) have no balance field: credit the allowance once and remember it.
  const hasBalance = typeof parsed.balance === 'number' && Number.isFinite(parsed.balance)
  const allowanceGranted = parsed.allowanceGranted === true

  return {
    version: SAVE_VERSION,
    createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    updatedAt: Date.now(),
    profile: {
      name: profile.name.slice(0, 24),
      gender: safeGender,
      skinTone: typeof profile.skinTone === 'string' ? profile.skinTone : '#8d5524',
      hairStyle: clampNumber(profile.hairStyle, 0, 0, 5),
      hairColor: typeof profile.hairColor === 'string' ? profile.hairColor : '#1b1b1f',
      outfitId,
    },
    gender: safeGender,
    lifestyle,
    hostelId: hostel.id,
    hostelName: hostel.name,
    balance: hasBalance
      ? Math.max(0, clampNumber(parsed.balance, 0, 0, 999_999_999))
      : STARTING_ALLOWANCE[lifestyle],
    allowanceGranted: allowanceGranted || !hasBalance,
    equipment: {
      outfitId,
      furniture: sanitizeFurniture(equipment.furniture),
    },
    inventory,
    missions: sanitizeMissions(parsed.missions),
    stats: sanitizeStats(parsed.stats),
    settings: sanitizeSettings(parsed.settings),
    needs: sanitizeNeeds(parsed.needs),
    relationships: sanitizeRelationships(parsed.relationships),
    locationId: sanitizeLocation(parsed.locationId),
    clock: sanitizeClock(parsed.clock),
    revealSeen: parsed.revealSeen === true,
  }
}

function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function loadSave(): SaveData | null {
  const store = storage()
  if (!store) return null
  try {
    // v1 saves used a different key; fall back so old players keep their character.
    const raw = store.getItem(SAVE_KEY) ?? store.getItem('babcock-life-save-v1')
    return parseSave(raw)
  } catch {
    return null
  }
}

export function persistSave(save: SaveData): void {
  const store = storage()
  if (!store) return
  try {
    store.setItem(SAVE_KEY, JSON.stringify({ ...save, updatedAt: Date.now() }))
  } catch {
    // Storage full or blocked (private mode) - the game keeps running in memory.
  }
}

export function clearSave(): void {
  const store = storage()
  if (!store) return
  try {
    store.removeItem(SAVE_KEY)
    store.removeItem('babcock-life-save-v1')
  } catch {
    // ignore
  }
}

export function hasSave(): boolean {
  return loadSave() !== null
}
