import type { InteractionOffer, NpcDef, SaveData, ShopItem } from '../types'
import { formatMoney } from './constants'
import { getItem } from './EconomySystem'

export const MAX_RELATIONSHIP = 100

export interface RelationshipTier {
  id: 'stranger' | 'acquaintance' | 'friend' | 'close' | 'bestie'
  label: string
  min: number
  tone: string
  blurb: string
}

export const TIERS: RelationshipTier[] = [
  {
    id: 'stranger',
    label: 'Stranger',
    min: 0,
    tone: '#94a3b8',
    blurb: 'You have not really spoken yet.',
  },
  {
    id: 'acquaintance',
    label: 'Acquaintance',
    min: 10,
    tone: '#38bdf8',
    blurb: 'They know your name and will greet you.',
  },
  {
    id: 'friend',
    label: 'Friend',
    min: 30,
    tone: '#4ade80',
    blurb: 'They will save you a seat and send you past questions.',
  },
  {
    id: 'close',
    label: 'Close friend',
    min: 55,
    tone: '#facc15',
    blurb: 'They cover for you when you miss a lecture.',
  },
  {
    id: 'bestie',
    label: 'Bestie',
    min: 80,
    tone: '#f472b6',
    blurb: 'Your person on campus, no questions asked.',
  },
]

export const HANGOUT_COST = 1_200
export const HELP_MINUTES = 45

export function relationshipTier(score: number): RelationshipTier {
  let tier = TIERS[0]
  for (const entry of TIERS) {
    if (score >= entry.min) tier = entry
  }
  return tier
}

export function nextTier(score: number): RelationshipTier | null {
  return TIERS.find((entry) => entry.min > score) ?? null
}

export function relationshipScore(save: SaveData, npcId: string): number {
  return save.relationships[npcId] ?? 0
}

export function hasMet(save: SaveData, npcId: string): boolean {
  return relationshipScore(save, npcId) > 0 || save.stats.npcsTalked.includes(npcId)
}

/** The most valuable gift currently sitting in the inventory. */
export function bestGiftItem(save: SaveData): ShopItem | undefined {
  return save.inventory
    .map((id) => getItem(id))
    .filter((item): item is ShopItem => Boolean(item) && item?.category === 'gift')
    .sort((a, b) => (b.giftValue ?? 10) - (a.giftValue ?? 10))[0]
}

export function interactionOffers(npc: NpcDef, save: SaveData): InteractionOffer[] {
  const score = relationshipScore(save, npc.id)
  const gift = bestGiftItem(save)
  const offers: InteractionOffer[] = []

  if (score === 0) {
    offers.push({
      id: 'introduce',
      label: 'Introduce yourself',
      blurb: `Say hello to ${npc.name} for the first time.`,
      minutes: 10,
    })
  }

  offers.push({
    id: 'chat',
    label: 'Have a conversation',
    blurb: 'Twenty minutes of proper gist. Builds goodwill.',
    minutes: 20,
  })

  offers.push({
    id: 'joke',
    label: 'Make a joke',
    blurb: 'Risky. Might land, might flop. Costs ten minutes either way.',
    minutes: 10,
  })

  offers.push({
    id: 'help',
    label: 'Ask for help',
    blurb: 'They might have a small paid task — or advice worth listening to.',
    minutes: HELP_MINUTES,
  })

  offers.push({
    id: 'hangout',
    label: 'Invite to hang out',
    blurb: `Spend two hours together for ${formatMoney(HANGOUT_COST)}.`,
    minutes: 120,
    cost: HANGOUT_COST,
    disabledReason:
      score < 10
        ? 'Become an acquaintance first (10 relationship).'
        : save.balance < HANGOUT_COST
          ? `You need ${formatMoney(HANGOUT_COST)} for snacks and transport.`
          : undefined,
  })

  offers.push({
    id: 'gift',
    label: 'Give a gift',
    blurb: gift ? `Give your ${gift.name} to ${npc.name}.` : 'You have no gift to give right now.',
    minutes: 5,
    disabledReason: gift ? undefined : 'Buy chocolates, airtime or flowers at the Campus Mart.',
  })

  return offers
}
