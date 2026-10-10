import type { Clock, Needs, SaveData, SaveStats } from '../types'
import { formatMoney } from './constants'
import { applyNeedDeltas } from './NeedsSystem'
import { isWeekend } from './timeState'

/** Stats that can be changed with deltas (networked stats like arrays are excluded). */
export type NumericStatKey =
  | 'furniturePurchased'
  | 'mealsBought'
  | 'studySessions'
  | 'lecturesAttended'
  | 'jobsDone'
  | 'hangouts'
  | 'giftsGiven'
  | 'nightsSlept'
  | 'eventsExperienced'
  | 'daysPlayed'
  | 'jobsToday'
  | 'jobDay'
  | 'lastWorkoutDay'

const NUMERIC_STATS: NumericStatKey[] = [
  'furniturePurchased',
  'mealsBought',
  'studySessions',
  'lecturesAttended',
  'jobsDone',
  'hangouts',
  'giftsGiven',
  'nightsSlept',
  'eventsExperienced',
  'daysPlayed',
  'jobsToday',
  'jobDay',
  'lastWorkoutDay',
]

/** Applies numeric stat increases to a save (array/boolean stats are never touched). */
export function applyStatDeltas(save: SaveData, deltas: Partial<Record<NumericStatKey, number>>): SaveData {
  const stats = { ...save.stats }
  for (const key of NUMERIC_STATS) {
    const delta = deltas[key]
    if (typeof delta !== 'number') continue
    stats[key] = Math.max(0, stats[key] + delta)
  }
  return { ...save, stats }
}

export interface EventEffect {
  balance?: number
  needs?: Partial<Needs>
  relationship?: { npc: string; delta: number }
  /** Stat increases (deltas, not absolute values). */
  stats?: Partial<SaveStats>
  minutes?: number
  /** Shown to the player after they choose. */
  result: string
}

export interface EventChoice {
  id: string
  label: string
  hint?: string
  /** The option is disabled (but still visible) when you cannot afford it. */
  requiresMoney?: number
  effect: EventEffect
}

export interface CampusEventDef {
  id: string
  title: string
  body: string
  icon: string
  tag: 'Social' | 'Money' | 'Academics' | 'Hostel' | 'Campus'
  weight: number
  minDay?: number
  available?: (save: SaveData, clock: Clock) => boolean
  choices: EventChoice[]
}

export const EVENTS: CampusEventDef[] = [
  {
    id: 'hangout_invite',
    title: 'Amara wants to hang out',
    body: '“We are going for karaoke at the pavilion. Come through — ₦1,000 covers your drink.”',
    icon: 'music',
    tag: 'Social',
    weight: 10,
    choices: [
      {
        id: 'go',
        label: 'Go with them',
        hint: '₦1,000 · 90 min',
        requiresMoney: 1_000,
        effect: {
          balance: -1_000,
          needs: { social: 15, happiness: 11, energy: -8 },
          relationship: { npc: 'amara', delta: 9 },
          minutes: 90,
          result: 'You sang badly, laughed hard and gained a proper friend.',
        },
      },
      {
        id: 'skip',
        label: 'Stay in and rest',
        effect: {
          needs: { happiness: -3, energy: 4 },
          relationship: { npc: 'amara', delta: -4 },
          result: 'You slept early. Amara posted the videos without you.',
        },
      },
    ],
  },
  {
    id: 'assignment_drop',
    title: 'Assignment just dropped',
    body: 'Someone in the class group chat has submitted the work already. The deadline is tomorrow at noon.',
    icon: 'book',
    tag: 'Academics',
    weight: 11,
    choices: [
      {
        id: 'start',
        label: 'Do it now',
        hint: '120 min · energy -12',
        effect: {
          needs: { academic: 14, energy: -12, hunger: -8 },
          stats: { studySessions: 1 },
          minutes: 120,
          result: 'You finished it in one sitting and went to bed with a clear conscience.',
        },
      },
      {
        id: 'later',
        label: 'Sleep first, submit later',
        effect: {
          needs: { academic: -6, energy: 5 },
          result: 'You slept well. The assignment is still staring at you.',
        },
      },
    ],
  },
  {
    id: 'unexpected_expense',
    title: 'Unexpected expense',
    body: 'Your data finished, your notebook is full and the course rep is collecting printing money.',
    icon: 'banknote',
    tag: 'Money',
    weight: 9,
    choices: [
      {
        id: 'pay',
        label: `Pay ${formatMoney(2_500)}`,
        requiresMoney: 2_500,
        effect: {
          balance: -2_500,
          needs: { academic: 4, happiness: -2 },
          result: 'Painful, but everything is printed and you are back online.',
        },
      },
      {
        id: 'manage',
        label: 'Manage without it',
        effect: {
          needs: { academic: -5, happiness: -4, social: -3 },
          result: 'You borrowed a pen and someone else’s hotspot all week.',
        },
      },
    ],
  },
  {
    id: 'paid_task',
    title: 'Tunde has a small job',
    body: '“I need somebody to move the sports equipment into the store. Takes an hour, I will pay you.”',
    icon: 'briefcase',
    tag: 'Money',
    weight: 10,
    choices: [
      {
        id: 'accept',
        label: 'Accept the task',
        hint: '+₦2,000 · 60 min',
        effect: {
          balance: 2_000,
          needs: { energy: -8, social: 4 },
          stats: { jobsDone: 1 },
          relationship: { npc: 'tunde', delta: 6 },
          minutes: 60,
          result: '₦2,000 in your hand and Tunde now considers you useful.',
        },
      },
      {
        id: 'decline',
        label: 'Decline politely',
        effect: {
          relationship: { npc: 'tunde', delta: -3 },
          needs: { happiness: 2 },
          result: 'You kept your hour. Tunde found somebody else within two minutes.',
        },
      },
    ],
  },
  {
    id: 'concert_tonight',
    title: 'Concert tonight',
    body: 'Student Week opens with a concert at the event ground. Gate fee is ₦1,500 and everybody is going.',
    icon: 'party',
    tag: 'Campus',
    weight: 9,
    available: (_save, clock) => clock.hour >= 12,
    choices: [
      {
        id: 'go',
        label: 'Buy a ticket and go',
        hint: '₦1,500 · 120 min',
        requiresMoney: 1_500,
        effect: {
          balance: -1_500,
          needs: { happiness: 18, social: 15, energy: -10 },
          minutes: 120,
          result: 'Best night of the semester so far. Your voice is gone.',
        },
      },
      {
        id: 'study',
        label: 'Stay in and study',
        effect: {
          needs: { academic: 8, happiness: -4, social: -5 },
          stats: { studySessions: 1 },
          result: 'You studied while the whole campus vibrated. Noble and slightly lonely.',
        },
      },
    ],
  },
  {
    id: 'exam_help',
    title: 'Blessing needs help revising',
    body: '“I have the CAT tomorrow and I am lost. Can you run through the topics with me?”',
    icon: 'users',
    tag: 'Academics',
    weight: 10,
    choices: [
      {
        id: 'help',
        label: 'Help her revise',
        hint: '120 min',
        effect: {
          needs: { academic: 11, social: 9, energy: -10, hunger: -6 },
          stats: { studySessions: 1 },
          relationship: { npc: 'blessing', delta: 13 },
          minutes: 120,
          result: 'Teaching it out loud made it stick for both of you.',
        },
      },
      {
        id: 'busy',
        label: 'Say you are busy',
        effect: {
          relationship: { npc: 'blessing', delta: -5 },
          needs: { happiness: -2 },
          result: 'She said "no problem" in a way that meant there was a problem.',
        },
      },
    ],
  },
  {
    id: 'student_group',
    title: 'Join a student group?',
    body: 'The Entrepreneurship Club is recruiting. ₦1,000 dues and one meeting a week.',
    icon: 'sparkles',
    tag: 'Social',
    weight: 8,
    minDay: 2,
    choices: [
      {
        id: 'join',
        label: 'Join the club',
        hint: '₦1,000 dues',
        requiresMoney: 1_000,
        effect: {
          balance: -1_000,
          needs: { social: 13, happiness: 7, academic: 4 },
          result: 'You are now officially in too many group chats.',
        },
      },
      {
        id: 'pass',
        label: 'Not this semester',
        effect: {
          needs: { social: -2 },
          result: 'You saved the dues. Your Thursday evenings remain yours.',
        },
      },
    ],
  },
  {
    id: 'jollof_competition',
    title: 'Inter-hostel jollof competition',
    body: 'Your hostel needs one more team member for the cook-off. Entry is ₦800 for ingredients.',
    icon: 'utensils',
    tag: 'Social',
    weight: 8,
    choices: [
      {
        id: 'enter',
        label: 'Enter the competition',
        hint: '₦800 entry',
        requiresMoney: 800,
        effect: {
          balance: -800,
          needs: { happiness: 15, social: 11, energy: -8 },
          stats: { hangouts: 1 },
          relationship: { npc: 'adaeze', delta: 8 },
          minutes: 90,
          result: 'Your hostel came second. The judging was clearly biased.',
        },
      },
      {
        id: 'judge',
        label: 'Judge instead',
        effect: {
          needs: { happiness: 6, social: 6 },
          minutes: 60,
          result: 'Free food and zero responsibility. Elite decision.',
        },
      },
    ],
  },
  {
    id: 'rainy_day',
    title: 'Rain on your laundry',
    body: 'It just started raining and your clothes are still on the line outside.',
    icon: 'droplets',
    tag: 'Hostel',
    weight: 7,
    choices: [
      {
        id: 'rescue',
        label: 'Run out and rescue them',
        hint: '20 min',
        effect: {
          needs: { hygiene: 5, energy: -5 },
          minutes: 20,
          result: 'You saved the load and gained a reputation for being prepared.',
        },
      },
      {
        id: 'leave',
        label: 'Leave it, it will dry again',
        effect: {
          needs: { hygiene: -9, happiness: -3 },
          result: 'Your clothes absorbed the entire harmattan-rain mix. Well done.',
        },
      },
    ],
  },
  {
    id: 'neighbour_favour',
    title: 'Adaeze needs a favour',
    body: '“My shuttle fare finished. Can you lend me ₦1,000? I will return it, I promise.”',
    icon: 'banknote',
    tag: 'Money',
    weight: 9,
    choices: [
      {
        id: 'lend',
        label: 'Lend the ₦1,000',
        requiresMoney: 1_000,
        effect: {
          balance: -1_000,
          needs: { happiness: 5, social: 5 },
          relationship: { npc: 'adaeze', delta: 12 },
          result: 'She was already knocking on your door with hot water the next morning.',
        },
      },
      {
        id: 'no',
        label: 'Explain you are broke too',
        effect: {
          relationship: { npc: 'adaeze', delta: -6 },
          needs: { happiness: -2 },
          result: 'Awkward silence in the corridor for the next three days.',
        },
      },
    ],
  },
  {
    id: 'bursary_form',
    title: 'Bursary form closes today',
    body: 'A departmental bursary is open to students who submit the form before close of day.',
    icon: 'graduation',
    tag: 'Campus',
    weight: 7,
    minDay: 3,
    choices: [
      {
        id: 'submit',
        label: 'Fill and submit it',
        hint: '45 min',
        effect: {
          balance: 5_000,
          needs: { academic: 5, energy: -5 },
          minutes: 45,
          result: 'Approved on the spot. ₦5,000 bursary credited.',
        },
      },
      {
        id: 'ignore',
        label: 'Skip it, too much paperwork',
        effect: {
          needs: { academic: -2 },
          result: 'You will hear about this bursary again from someone who got it.',
        },
      },
    ],
  },
  {
    id: 'weekend_market',
    title: 'Weekend market run',
    body: 'A trader just set up outside the gate with cheap provisions — but you have to go now before it closes.',
    icon: 'cart',
    tag: 'Money',
    weight: 7,
    available: (_save, clock) => isWeekend(clock.day),
    choices: [
      {
        id: 'buy',
        label: 'Stock up for ₦3,000',
        requiresMoney: 3_000,
        effect: {
          balance: -3_000,
          needs: { hunger: 16, happiness: 6 },
          result: 'Proper provisions in your cupboard. No more biscuits for dinner.',
        },
      },
      {
        id: 'window_shop',
        label: 'Window shop only',
        effect: {
          needs: { happiness: -1 },
          minutes: 30,
          result: 'You looked at everything, bought nothing, felt everything.',
        },
      },
    ],
  },
]

const TOTAL_WEIGHT = EVENTS.reduce((sum, event) => sum + event.weight, 0)

/** Picks an event that has not fired recently. Returns null when nothing is due. */
export function rollEvent(save: SaveData, clock: Clock): CampusEventDef | null {
  const pool = EVENTS.filter((event) => {
    if (save.stats.recentEvents.includes(event.id)) return false
    if (event.minDay && clock.day < event.minDay) return false
    if (event.available && !event.available(save, clock)) return false
    return true
  })
  if (pool.length === 0) return null

  const weight = pool.reduce((sum, event) => sum + event.weight, 0) || TOTAL_WEIGHT
  let roll = Math.random() * weight
  for (const event of pool) {
    roll -= event.weight
    if (roll <= 0) return event
  }
  return pool[pool.length - 1]
}

/** Remembers the last few events so the same one does not repeat constantly. */
export function rememberEvent(save: SaveData, eventId: string): string[] {
  return [eventId, ...save.stats.recentEvents].slice(0, 6)
}

export interface EventResolution {
  event: CampusEventDef
  choice: EventChoice
  effect: EventEffect
  save: SaveData
}

/**
 * Pure resolution of an event choice: money, needs, relationships and stats.
 * The store adds the elapsed time so this stays easy to test.
 */
export function resolveEventEffect(
  save: SaveData,
  event: CampusEventDef,
  choiceId: string,
): EventResolution | null {
  const choice = event.choices.find((entry) => entry.id === choiceId)
  if (!choice) return null
  if (choice.requiresMoney && save.balance < choice.requiresMoney) return null

  const effect = choice.effect
  let next: SaveData = save
  if (effect.balance) next = { ...next, balance: Math.max(0, next.balance + effect.balance) }
  if (effect.needs) next = { ...next, needs: applyNeedDeltas(next.needs, effect.needs) }
  if (effect.relationship) {
    const current = next.relationships[effect.relationship.npc] ?? 0
    next = {
      ...next,
      relationships: {
        ...next.relationships,
        [effect.relationship.npc]: Math.max(0, Math.min(100, current + effect.relationship.delta)),
      },
    }
  }
  if (effect.stats) next = applyStatDeltas(next, effect.stats)
  next = {
    ...next,
    stats: {
      ...next.stats,
      eventsExperienced: next.stats.eventsExperienced + 1,
      recentEvents: rememberEvent(next, event.id),
    },
  }
  return { event, choice, effect, save: next }
}
