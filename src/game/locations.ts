import type { LocationId } from '../types'

export interface LocationDef {
  id: LocationId
  name: string
  short: string
  blurb: string
  /** Marker position on the campus map, in a 0..100 grid. */
  mapX: number
  mapY: number
  travelMinutes: number
  /** Opening hours as [open, close]; windows may wrap past midnight. */
  open: [number, number]
  /** Interiors get an enclosed scene, outdoors get sky and props. */
  indoor: boolean
}

export const LOCATIONS: Record<LocationId, LocationDef> = {
  hostel: {
    id: 'hostel',
    name: 'Your Hostel Room',
    short: 'Hostel',
    blurb: 'Your base on campus: sleep, shower, study and decorate.',
    mapX: 22,
    mapY: 26,
    travelMinutes: 0,
    open: [0, 24],
    indoor: true,
  },
  cafeteria: {
    id: 'cafeteria',
    name: 'Amala Food Court',
    short: 'Food Court',
    blurb: 'Jollof, beans, chapman and Mama Ngozika running the counter.',
    mapX: 46,
    mapY: 44,
    travelMinutes: 8,
    open: [6, 21],
    indoor: true,
  },
  lecture: {
    id: 'lecture',
    name: 'Science Lecture Theatre',
    short: 'Lecture Hall',
    blurb: 'Lectures, study groups and Dr. Adeyemi pretending not to notice latecomers.',
    mapX: 64,
    mapY: 22,
    travelMinutes: 12,
    open: [7, 19],
    indoor: true,
  },
  library: {
    id: 'library',
    name: 'Alumni Library',
    short: 'Library',
    blurb: 'Silence, cold AC and the only place your CGPA has a chance.',
    mapX: 78,
    mapY: 44,
    travelMinutes: 15,
    open: [7, 22],
    indoor: true,
  },
  sports: {
    id: 'sports',
    name: 'Sports Centre',
    short: 'Sports',
    blurb: 'Football pitch, basketball court and Tunde screaming instructions.',
    mapX: 34,
    mapY: 74,
    travelMinutes: 18,
    open: [6, 20],
    indoor: false,
  },
  shop: {
    id: 'shop',
    name: 'Campus Mart',
    short: 'Campus Mart',
    blurb: 'Snacks, outfits, room upgrades and a cashier who knows everybody.',
    mapX: 58,
    mapY: 66,
    travelMinutes: 10,
    open: [8, 20],
    indoor: true,
  },
  hangout: {
    id: 'hangout',
    name: 'Student Union Pavilion',
    short: 'Hangout',
    blurb: 'Benches, board games, loud speakers and everybody\u2019s gist.',
    mapX: 76,
    mapY: 76,
    travelMinutes: 14,
    open: [11, 24],
    indoor: false,
  },
  event: {
    id: 'event',
    name: 'Campus Event Ground',
    short: 'Event Ground',
    blurb: 'Concerts, matriculation parties and student week madness.',
    mapX: 14,
    mapY: 52,
    travelMinutes: 20,
    open: [8, 23],
    indoor: false,
  },
}

/** One-line travel summary used by the campus map. */
export function travelLabel(current: LocationId, target: LocationId): string {
  if (current === target) return 'You are here'
  return `${LOCATIONS[target].travelMinutes} min walk`
}
