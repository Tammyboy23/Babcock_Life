export type Gender = 'boy' | 'girl'
export type Lifestyle = 'NEPO' | 'LAPO'

/** Every place the player can be. Locations replace the old free-roam 3D worlds. */
export type LocationId =
  | 'hostel'
  | 'cafeteria'
  | 'lecture'
  | 'library'
  | 'sports'
  | 'shop'
  | 'hangout'
  | 'event'

export type Screen = 'menu' | 'character' | 'reveal' | 'game'

export type PanelId =
  | 'missions'
  | 'inventory'
  | 'shop'
  | 'character'
  | 'settings'
  | 'map'
  | 'relationships'
  | 'schedule'

export type ItemCategory = 'outfit' | 'furniture' | 'consumable' | 'gift'

/** In-game phases of the day. */
export type TimePhase = 'Morning' | 'Afternoon' | 'Evening' | 'Night'

/** Simulated clock. `hour` is a float in 0..24, `day` starts at 1 (a Monday). */
export interface Clock {
  day: number
  hour: number
}

export type NeedKey = 'hunger' | 'energy' | 'hygiene' | 'happiness' | 'social' | 'academic'

/** All needs are 0..100 where 100 is fully satisfied. */
export type Needs = Record<NeedKey, number>

export interface ShopItem {
  id: string
  name: string
  category: ItemCategory
  price: number
  blurb: string
  /** Outfits re-colour / re-style the player avatar. */
  style?: number
  primary?: string
  secondary?: string
  /** Furniture appears in the hostel room when owned. */
  slot?: FurnitureSlot
  /** 0 = starter / modest, 1 = comfortable, 2 = premium. Drives room visuals. */
  tier?: number
  /** Consumables and gifts can be bought more than once. */
  repeatable?: boolean
  /** What the item restores when used from the inventory. */
  needs?: Partial<Needs>
  /** Relationship value when given as a gift. */
  giftValue?: number
}

export type FurnitureSlot =
  | 'bed'
  | 'desk'
  | 'chair'
  | 'rug'
  | 'shelf'
  | 'fridge'
  | 'lamp'
  | 'art'
  | 'plant'
  | 'ac'

export interface PlayerProfile {
  name: string
  gender: Gender
  skinTone: string
  hairStyle: number
  hairColor: string
  /** Currently worn outfit id (always owned). */
  outfitId: string
}

export interface MissionProgress {
  status: 'locked' | 'available' | 'active' | 'completed'
  counter: number
  completedAt?: number
}

export interface MissionDef {
  id: string
  title: string
  description: string
  objective: string
  steps: string[]
  goal: number
  reward: number
  /** Student who hands out the mission. Missions without a giver start active. */
  giver?: string
  autoStart?: boolean
  completionHint: string
}

export interface Settings {
  masterVolume: number
  muted: boolean
  /** Scene transitions and ambient motion. */
  animations: boolean
  /** Contextual hints in the HUD and location view. */
  showTips: boolean
}

export interface SaveStats {
  /** Students the player has met (introduced themselves to). */
  npcsTalked: string[]
  /** Locations the player has travelled to at least once. */
  locationsVisited: string[]
  furniturePurchased: number
  mealsBought: number
  studySessions: number
  lecturesAttended: number
  jobsDone: number
  hangouts: number
  giftsGiven: number
  nightsSlept: number
  scheduleChecked: boolean
  /** Day number of the last paid work shift and how many were worked that day. */
  jobDay: number
  jobsToday: number
  /** Day of the last free-sports-stipend workout. */
  lastWorkoutDay: number
  eventsExperienced: number
  /** Last few event ids, so the same event does not fire twice in a row. */
  recentEvents: string[]
  daysPlayed: number
  lastDay: number
}

export interface SaveData {
  version: number
  createdAt: number
  updatedAt: number
  profile: PlayerProfile
  gender: Gender
  lifestyle: Lifestyle
  hostelId: string
  hostelName: string
  balance: number
  /** Set true the first time the allowance is credited. Guards against re-granting. */
  allowanceGranted: boolean
  equipment: {
    outfitId: string
    /** Furniture slot -> owned shop item id. Missing slots render as empty. */
    furniture: Partial<Record<FurnitureSlot, string>>
  }
  /** True once the lifestyle reveal sequence has been shown. */
  revealSeen: boolean
  inventory: string[]
  missions: Record<string, MissionProgress>
  stats: SaveStats
  settings: Settings
  needs: Needs
  /** Student id -> relationship score 0..100. */
  relationships: Record<string, number>
  locationId: LocationId
  clock: Clock
}

export interface ToastMessage {
  id: number
  title: string
  body?: string
  kind: 'info' | 'success' | 'reward' | 'error'
}

/** A fictional student. Relationships are per-save and grow through interaction. */
export interface NpcDef {
  id: string
  name: string
  gender: Gender
  /** Short role line, e.g. "300 Level, Accounting". */
  tag: string
  personality: string
  interests: string[]
  location: LocationId
  skinTone: string
  hairStyle: number
  hairColor: string
  outfitPrimary: string
  outfitSecondary: string
  /** Interaction flavour lines, one pool per interaction type. */
  lines: {
    first: string[]
    chat: string[]
    joke: string
    jokeFlop: string
    help: string[]
    hangout: string
    gift: string
  }
  /** Mission this student hands out, if any. */
  missionId?: string
}

export type InteractionId = 'introduce' | 'chat' | 'joke' | 'help' | 'hangout' | 'gift'

export interface InteractionOffer {
  id: InteractionId
  label: string
  blurb: string
  minutes: number
  cost?: number
  disabledReason?: string
}
