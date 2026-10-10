import type { FurnitureSlot, Lifestyle, ShopItem } from '../types'

export const STARTER_OUTFIT = 'outfit-tee'

export const SHOP_ITEMS: ShopItem[] = [
  // ---------------------------------------------------------------- outfits
  {
    id: 'outfit-tee',
    name: 'Campus Tee',
    category: 'outfit',
    price: 0,
    blurb: 'Plain white tee, blue jeans. The default student starter kit.',
    style: 0,
    primary: '#f8fafc',
    secondary: '#2f5d9e',
  },
  {
    id: 'outfit-sport',
    name: 'Sporty Kit',
    category: 'outfit',
    price: 4_000,
    blurb: 'Jersey and track pants. Perfect for the sports centre.',
    style: 1,
    primary: '#16a34a',
    secondary: '#0f172a',
  },
  {
    id: 'outfit-ankara',
    name: 'Ankara Set',
    category: 'outfit',
    price: 6_500,
    blurb: 'Tailored ankara print. Mad respect at the pavilion.',
    style: 2,
    primary: '#d97706',
    secondary: '#7c2d12',
  },
  {
    id: 'outfit-denim',
    name: 'Denim & Kicks',
    category: 'outfit',
    price: 9_500,
    blurb: 'Denim jacket, dark jeans and fresh sneakers.',
    style: 3,
    primary: '#3b82f6',
    secondary: '#1e293b',
  },
  {
    id: 'outfit-agbada',
    name: 'Premium Agbada',
    category: 'outfit',
    price: 45_000,
    blurb: 'Full agbada ensemble with gold embroidery. Serious statement.',
    style: 4,
    primary: '#f5c451',
    secondary: '#4c1d95',
  },

  // -------------------------------------------------------------- furniture
  {
    id: 'furn-bed-basic',
    name: 'Basic Bunk Mattress',
    category: 'furniture',
    price: 0,
    blurb: 'Standard hostel mattress on a metal frame.',
    slot: 'bed',
    tier: 0,
  },
  {
    id: 'furn-bed-premium',
    name: 'Premium Bed Set',
    category: 'furniture',
    price: 45_000,
    blurb: 'Deep mattress, thick duvet and matching pillows.',
    slot: 'bed',
    tier: 1,
  },
  {
    id: 'furn-bed-luxe',
    name: 'Executive Double Bed',
    category: 'furniture',
    price: 90_000,
    blurb: 'Wide bed with upholstered headboard and side lamps.',
    slot: 'bed',
    tier: 2,
  },
  {
    id: 'furn-desk-small',
    name: 'Study Desk',
    category: 'furniture',
    price: 12_000,
    blurb: 'Compact wooden desk with a reading lamp.',
    slot: 'desk',
    tier: 0,
  },
  {
    id: 'furn-desk-large',
    name: 'Executive Study Desk',
    category: 'furniture',
    price: 38_000,
    blurb: 'Wide desk, monitor and an actual drawer that closes.',
    slot: 'desk',
    tier: 1,
  },
  {
    id: 'furn-chair-plastic',
    name: 'Plastic Chair',
    category: 'furniture',
    price: 0,
    blurb: 'White plastic monobloc. A Nigerian classic.',
    slot: 'chair',
    tier: 0,
  },
  {
    id: 'furn-chair-ergo',
    name: 'Ergonomic Chair',
    category: 'furniture',
    price: 18_000,
    blurb: 'Padded chair with wheels. Back pain, solved.',
    slot: 'chair',
    tier: 1,
  },
  {
    id: 'furn-chair-luxe',
    name: 'Executive Swivel Chair',
    category: 'furniture',
    price: 30_000,
    blurb: 'High-back leather swivel. The hostel CEO look.',
    slot: 'chair',
    tier: 2,
  },
  {
    id: 'furn-desk-luxe',
    name: 'Executive Corner Desk',
    category: 'furniture',
    price: 72_000,
    blurb: 'Wide L-shaped desk with drawers and a second monitor.',
    slot: 'desk',
    tier: 2,
  },
  {
    id: 'furn-rug-luxe',
    name: 'Persian Rug',
    category: 'furniture',
    price: 22_000,
    blurb: 'Deep pile, deep colours. Guests will take their shoes off.',
    slot: 'rug',
    tier: 2,
  },
  {
    id: 'furn-shelf-luxe',
    name: 'Display Cabinet',
    category: 'furniture',
    price: 26_000,
    blurb: 'Glass-fronted shelves for books, trophies and snacks.',
    slot: 'shelf',
    tier: 2,
  },
  {
    id: 'furn-plant-luxe',
    name: 'Indoor Banana Plant',
    category: 'furniture',
    price: 12_000,
    blurb: 'Tall statement plant that survives harmattan and neglect.',
    slot: 'plant',
    tier: 2,
  },
  {
    id: 'furn-rug-fancy',
    name: 'Woven Rug',
    category: 'furniture',
    price: 8_000,
    blurb: 'Thick woven rug that makes the room feel like home.',
    slot: 'rug',
    tier: 1,
  },
  {
    id: 'furn-shelf-tall',
    name: 'Bookshelf',
    category: 'furniture',
    price: 15_000,
    blurb: 'Five shelves. Textbooks, gala and everything else.',
    slot: 'shelf',
    tier: 1,
  },
  {
    id: 'furn-fridge',
    name: 'Mini Fridge',
    category: 'furniture',
    price: 26_000,
    blurb: 'Cold water and leftover jollof. Hostel essentials.',
    slot: 'fridge',
    tier: 1,
  },
  {
    id: 'furn-lamp',
    name: 'Reading Lamp',
    category: 'furniture',
    price: 5_000,
    blurb: 'Warm bedside light for late-night revision.',
    slot: 'lamp',
    tier: 1,
  },
  {
    id: 'furn-art',
    name: 'Wall Art',
    category: 'furniture',
    price: 7_000,
    blurb: 'Framed print to cover up the peeling paint.',
    slot: 'art',
    tier: 1,
  },
  {
    id: 'furn-plant',
    name: 'Potted Palm',
    category: 'furniture',
    price: 4_500,
    blurb: 'Small indoor palm. Adds instant life to the room.',
    slot: 'plant',
    tier: 1,
  },
  {
    id: 'furn-ac',
    name: 'Split AC Unit',
    category: 'furniture',
    price: 60_000,
    blurb: 'Air conditioner. Harmattan and heat, handled.',
    slot: 'ac',
    tier: 1,
  },

  // ------------------------------------------------------------- consumables
  {
    id: 'item-jollof',
    name: 'Jollof Takeaway Pack',
    category: 'consumable',
    price: 1_200,
    blurb: 'Eat later in your room. Hunger +30, happiness +5.',
    needs: { hunger: 30, happiness: 5 },
    repeatable: true,
  },
  {
    id: 'item-energy-drink',
    name: 'Energy Drink',
    category: 'consumable',
    price: 800,
    blurb: 'Cold and suspiciously sweet. Energy +22.',
    needs: { energy: 22, happiness: 2 },
    repeatable: true,
  },
  {
    id: 'item-chapman',
    name: 'Chapman',
    category: 'consumable',
    price: 600,
    blurb: 'Nigerian party classic. Happiness +9, social +4.',
    needs: { happiness: 9, social: 4 },
    repeatable: true,
  },
  {
    id: 'item-biscuits',
    name: 'Biscuit Pack',
    category: 'consumable',
    price: 300,
    blurb: 'Emergency rations. Hunger +12.',
    needs: { hunger: 12 },
    repeatable: true,
  },

  // ------------------------------------------------------------------ gifts
  {
    id: 'gift-chocolate',
    name: 'Chocolate Bar',
    category: 'gift',
    price: 1_500,
    blurb: 'Small gift for a classmate. +12 relationship.',
    giftValue: 12,
    repeatable: true,
  },
  {
    id: 'gift-airtime',
    name: 'Airtime Top-up',
    category: 'gift',
    price: 2_000,
    blurb: 'Covers data and calls. +18 relationship.',
    giftValue: 18,
    repeatable: true,
  },
  {
    id: 'gift-flowers',
    name: 'Bouquet of Flowers',
    category: 'gift',
    price: 3_500,
    blurb: 'Serious gesture. +26 relationship.',
    giftValue: 26,
    repeatable: true,
  },
]

export const SHOP_BY_ID: Record<string, ShopItem> = SHOP_ITEMS.reduce<Record<string, ShopItem>>(
  (acc, item) => {
    acc[item.id] = item
    return acc
  },
  {},
)

export function getItem(id: string): ShopItem | undefined {
  return SHOP_BY_ID[id]
}

export const STARTER_FURNITURE: Record<Lifestyle, Partial<Record<FurnitureSlot, string>>> = {
  // NEPO starts comfortable but still has room to upgrade, so missions stay
  // reachable for both lifestyles.
  NEPO: {
    bed: 'furn-bed-premium',
    desk: 'furn-desk-large',
    chair: 'furn-chair-ergo',
    rug: 'furn-rug-fancy',
    fridge: 'furn-fridge',
    ac: 'furn-ac',
  },
  LAPO: {
    bed: 'furn-bed-basic',
    desk: 'furn-desk-small',
    chair: 'furn-chair-plastic',
  },
}

export interface PurchaseResult {
  ok: boolean
  error?: string
  /** Furniture slot that was upgraded, if any. */
  slot?: FurnitureSlot
}

/** Pure validation so the UI and the store share one source of truth. */
export function validatePurchase(
  balance: number,
  itemId: string,
  owned: Partial<Record<FurnitureSlot, string>>,
  inventory: string[],
): PurchaseResult {
  const item = getItem(itemId)
  if (!item) return { ok: false, error: 'Unknown item' }
  if (balance < item.price) {
    return { ok: false, error: `Not enough money. You need ${item.price - balance} more.` }
  }
  if (item.category === 'furniture') {
    if (!item.slot) return { ok: false, error: 'Invalid furniture item' }
    if (owned[item.slot] === item.id) return { ok: false, error: 'Already installed in your room' }
  }
  if (item.category === 'outfit' && inventory.includes(item.id)) {
    return { ok: false, error: 'You already own this outfit' }
  }
  return { ok: true, slot: item.slot }
}

export function ownedFurnitureList(owned: Partial<Record<FurnitureSlot, string>>): ShopItem[] {
  return Object.values(owned)
    .map((id) => (id ? getItem(id) : undefined))
    .filter((item): item is ShopItem => Boolean(item))
}

/** Furniture tier lookup used by the room scene to decide how luxurious it looks. */
export function furnitureTier(
  owned: Partial<Record<FurnitureSlot, string>>,
  slot: FurnitureSlot,
): number {
  const id = owned[slot]
  if (!id) return -1
  return getItem(id)?.tier ?? 0
}
