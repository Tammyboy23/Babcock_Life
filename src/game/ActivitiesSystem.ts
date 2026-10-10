import type { Clock, LocationId, Needs, PanelId, SaveData, SaveStats } from '../types'
import { formatMoney } from './constants'
import { academicGainMultiplier, energyGainMultiplier, socialGainMultiplier } from './NeedsSystem'
import { currentCampusEvent, currentLecture, nextCampusEvent, nextEntryLabel } from './ScheduleSystem'
import { formatDuration, isWithinHours, weekdayName } from './timeState'

export type ActivitySfx = 'click' | 'interact' | 'reward' | 'error' | 'buy' | 'sleep' | 'pickup' | 'door'

export interface ActivityOutcome {
  /** Need deltas; the store applies multipliers for gains before this points. */
  needs?: Partial<Needs>
  balance?: number
  stats?: Partial<SaveStats>
  relationships?: Record<string, number>
  /** Opens a panel as the activity's result. */
  panel?: PanelId
  /** If set, the clock jumps here instead of advancing by `minutes`. */
  clockOverride?: Clock
  /** Decay the elapsed minutes as sleep. */
  asleep?: boolean
  /** Chance (0..1) that a campus event fires after the activity. */
  eventChance?: number
  sfx?: ActivitySfx
  title: string
  body: string
}

export interface ActivityDef {
  id: string
  location: LocationId
  label: string
  blurb: string
  icon: string
  minutes: number
  cost?: number
  requiresEnergy?: number
  /** Return a reason string when the activity is currently unavailable. */
  blocked?: (save: SaveData, clock: Clock) => string | null
  /** Hidden unless this returns true. */
  visible?: (save: SaveData, clock: Clock) => boolean
  run: (save: SaveData, clock: Clock) => ActivityOutcome
}

function scaled(value: number, multiplier: number): number {
  return Math.round(value * multiplier)
}

function canAfford(save: SaveData, cost: number): string | null {
  return save.balance < cost
    ? `You need ${formatMoney(cost - save.balance)} more for this.`
    : null
}

function jobPayBlocked(save: SaveData): string | null {
  if (save.stats.jobDay === save.clock.day && save.stats.jobsToday >= 2) {
    return 'You have already worked two shifts today. Rest and come back tomorrow.'
  }
  return null
}

function jobStats(save: SaveData): Partial<SaveStats> {
  const sameDay = save.stats.jobDay === save.clock.day
  return {
    jobsDone: save.stats.jobsDone + 1,
    jobsToday: sameDay ? save.stats.jobsToday + 1 : 1,
    jobDay: save.clock.day,
  }
}

export const ACTIVITIES: ActivityDef[] = [
  // ------------------------------------------------------------------ hostel
  {
    id: 'sleep',
    location: 'hostel',
    label: 'Sleep until morning',
    blurb: 'Fully restores energy and starts the next day at 07:00.',
    icon: 'bed',
    minutes: 0,
    run: (save) => ({
      clockOverride: { day: 0, hour: 7 },
      asleep: true,
      needs: { energy: 100, hunger: -30, hygiene: -12, happiness: 3 },
      stats: { nightsSlept: save.stats.nightsSlept + 1 },
      sfx: 'sleep',
      title: 'You slept',
      body: 'A new morning at 07:00. Energy is topped up but you are hungry.',
    }),
  },
  {
    id: 'nap',
    location: 'hostel',
    label: 'Power nap',
    blurb: 'One hour on the bed for a quick energy boost.',
    icon: 'moon',
    minutes: 60,
    run: (save) => ({
      needs: { energy: scaled(18, energyGainMultiplier(save.needs)), happiness: 3 },
      asleep: true,
      title: 'Quick nap',
      body: 'Energy restored. Sleep properly tonight to reset fully.',
    }),
  },
  {
    id: 'shower',
    location: 'hostel',
    label: 'Take a shower',
    blurb: 'Hygiene +35 so people actually enjoy your company.',
    icon: 'droplets',
    minutes: 20,
    run: () => ({
      needs: { hygiene: 35, energy: -3, happiness: 2 },
      title: 'Fresh and clean',
      body: 'Hygiene restored. Conversations will land better.',
    }),
  },
  {
    id: 'study_room',
    location: 'hostel',
    label: 'Study at your desk',
    blurb: 'Private revision session at your own desk.',
    icon: 'book',
    minutes: 90,
    requiresEnergy: 8,
    run: (save) => ({
      needs: {
        academic: scaled(12, academicGainMultiplier(save.needs)),
        energy: -12,
        hunger: -7,
        happiness: -1,
      },
      stats: { studySessions: save.stats.studySessions + 1 },
      title: 'Study session done',
      body: 'Academic progress up. Second sessions in the same day give less.',
    }),
  },
  {
    id: 'change_outfit',
    location: 'hostel',
    label: 'Change outfit',
    blurb: 'Open your wardrobe and pick what to wear.',
    icon: 'shirt',
    minutes: 5,
    run: () => ({
      panel: 'inventory',
      title: 'Wardrobe open',
      body: 'Pick an outfit from your inventory.',
    }),
  },
  {
    id: 'mirror_appearance',
    location: 'hostel',
    label: 'Check the mirror',
    blurb: 'Change your hairstyle, hair colour or skin tone instantly.',
    icon: 'sparkles',
    minutes: 5,
    run: () => ({
      panel: 'character',
      needs: { happiness: 2 },
      title: 'Mirror check',
      body: 'Good. Now pick an appearance that matches your energy.',
    }),
  },
  {
    id: 'decorate_room',
    location: 'hostel',
    label: 'Shop for room upgrades',
    blurb: 'Open the Campus Mart catalogue for furniture and decor.',
    icon: 'sofa',
    minutes: 0,
    run: () => ({
      panel: 'shop',
      title: 'Campus Mart catalogue',
      body: 'Anything you buy appears in your room instantly.',
    }),
  },
  {
    id: 'check_schedule',
    location: 'hostel',
    label: 'Check your schedule',
    blurb: 'See today\u2019s lectures and what is coming up this week.',
    icon: 'calendar',
    minutes: 5,
    run: (save) => ({
      panel: 'schedule',
      stats: { scheduleChecked: true },
      title: 'Schedule checked',
      body: `Next up: ${nextEntryLabel(save.clock)}`,
    }),
  },
  {
    id: 'check_belongings',
    location: 'hostel',
    label: 'Check your belongings',
    blurb: 'Open the inventory: outfits, snacks and gifts.',
    icon: 'backpack',
    minutes: 0,
    run: () => ({ panel: 'inventory', title: 'Belongings', body: 'Snacks and gifts can be used from here.' }),
  },
  {
    id: 'check_messages',
    location: 'hostel',
    label: 'Check your messages',
    blurb: 'Ten minutes of scrolling. Something usually comes up.',
    icon: 'mail',
    minutes: 10,
    run: () => ({
      needs: { social: 2 },
      eventChance: 0.85,
      title: 'Phone in hand',
      body: 'You scroll through the hostel group chat…',
    }),
  },
  {
    id: 'clean_room',
    location: 'hostel',
    label: 'Tidy the room',
    blurb: 'Sweep, arrange, throw out the gala wrappers.',
    icon: 'sparkles',
    minutes: 30,
    run: () => ({
      needs: { hygiene: 6, happiness: 5 },
      title: 'Room tidy',
      body: 'A clean room lifts the mood. Hygiene +6, happiness +5.',
    }),
  },

  // --------------------------------------------------------------- cafeteria
  {
    id: 'eat_breakfast',
    location: 'cafeteria',
    label: 'Bread, akara & tea',
    blurb: 'Cheap campus breakfast, served until 11:00.',
    icon: 'coffee',
    minutes: 25,
    cost: 350,
    blocked: (save, clock) =>
      isWithinHours(clock.hour, 6, 11) ? canAfford(save, 350) : 'Breakfast runs 06:00 – 11:00.',
    run: (save) => ({
      balance: -350,
      needs: { hunger: 22, happiness: 3, energy: scaled(4, energyGainMultiplier(save.needs)) },
      stats: { mealsBought: save.stats.mealsBought + 1 },
      sfx: 'buy',
      title: 'Breakfast eaten',
      body: 'Hunger +22 for only ₦350.',
    }),
  },
  {
    id: 'eat_jollof',
    location: 'cafeteria',
    label: 'Jollof rice & chicken',
    blurb: 'The food court special. Worth the queue.',
    icon: 'utensils',
    minutes: 40,
    cost: 1_200,
    blocked: (save) => canAfford(save, 1_200),
    run: (save) => ({
      balance: -1_200,
      needs: { hunger: 40, happiness: 8, energy: scaled(8, energyGainMultiplier(save.needs)) },
      stats: { mealsBought: save.stats.mealsBought + 1 },
      sfx: 'buy',
      title: 'Jollof demolished',
      body: 'Hunger +40, happiness +8.',
    }),
  },
  {
    id: 'eat_beans',
    location: 'cafeteria',
    label: 'Beans & plantain',
    blurb: 'Filling, affordable, and the queue is always shorter.',
    icon: 'utensils',
    minutes: 35,
    cost: 700,
    blocked: (save) => canAfford(save, 700),
    run: (save) => ({
      balance: -700,
      needs: { hunger: 32, happiness: 4, energy: scaled(6, energyGainMultiplier(save.needs)) },
      stats: { mealsBought: save.stats.mealsBought + 1 },
      sfx: 'buy',
      title: 'Beans and plantain',
      body: 'Hunger +32 for ₦700.',
    }),
  },
  {
    id: 'buy_chapman',
    location: 'cafeteria',
    label: 'Chapman & small chops',
    blurb: 'The unofficial official campus drink.',
    icon: 'cup',
    minutes: 20,
    cost: 600,
    blocked: (save) => canAfford(save, 600),
    run: () => ({
      balance: -600,
      needs: { happiness: 10, social: 4, hunger: 4 },
      sfx: 'buy',
      title: 'Chapman in hand',
      body: 'Happiness +10. Sugar does the rest.',
    }),
  },
  {
    id: 'chat_mama',
    location: 'cafeteria',
    label: 'Gist with Mama Ngozika',
    blurb: 'She hears everything that happens on this campus.',
    icon: 'users',
    minutes: 15,
    run: (save) => ({
      needs: { social: scaled(8, socialGainMultiplier(save.needs)), happiness: 4 },
      relationships: { 'mama-ngozika': 7 },
      title: 'Mama Ngozika gave you gist',
      body: 'Social +8 and she likes you a little more.',
    }),
  },
  {
    id: 'cafeteria_shift',
    location: 'cafeteria',
    label: 'Work a food court shift',
    blurb: 'Serve trays for ₦2,500. Two shifts per day, maximum.',
    icon: 'briefcase',
    minutes: 90,
    requiresEnergy: 15,
    blocked: (save) => jobPayBlocked(save),
    run: (save) => ({
      balance: 2_500,
      needs: { energy: -16, hunger: -8, hygiene: -8, social: 4, happiness: -2 },
      stats: jobStats(save),
      eventChance: 0.3,
      sfx: 'reward',
      title: 'Shift done',
      body: '₦2,500 earned. Your wrist and your patience are tired.',
    }),
  },

  // ------------------------------------------------------------------ lecture
  {
    id: 'attend_lecture',
    location: 'lecture',
    label: 'Attend the lecture',
    blurb: 'Only available while a lecture is actually running.',
    icon: 'graduation',
    minutes: 120,
    requiresEnergy: 10,
    blocked: (_save, clock) =>
      currentLecture(clock) ? null : `No lecture now. Next up: ${nextEntryLabel(clock)}`,
    run: (save) => ({
      needs: {
        academic: scaled(20, academicGainMultiplier(save.needs)),
        energy: -14,
        hunger: -10,
        happiness: -3,
      },
      stats: {
        lecturesAttended: save.stats.lecturesAttended + 1,
        studySessions: save.stats.studySessions + 1,
      },
      eventChance: 0.35,
      title: 'Lecture attended',
      body: 'Academic +20. Notes taken, phone on silent (mostly).',
    }),
  },
  {
    id: 'ask_lecturer',
    location: 'lecture',
    label: 'Ask Dr. Adeyemi a question',
    blurb: 'Twenty minutes of clarification after class.',
    icon: 'message',
    minutes: 20,
    blocked: (_save, clock) =>
      currentLecture(clock) || isWithinHours(clock.hour, 7, 19)
        ? null
        : 'The theatre is locked for the night.',
    run: (save) => ({
      needs: {
        academic: scaled(9, academicGainMultiplier(save.needs)),
        social: scaled(4, socialGainMultiplier(save.needs)),
      },
      relationships: { 'dr-adeyemi': 8 },
      title: 'Question answered',
      body: 'Academic +9 and Dr. Adeyemi remembers your face.',
    }),
  },
  {
    id: 'group_study',
    location: 'lecture',
    label: 'Join a study group',
    blurb: 'Four people, one whiteboard, two serious arguments.',
    icon: 'users',
    minutes: 90,
    requiresEnergy: 12,
    run: (save) => ({
      needs: {
        academic: scaled(14, academicGainMultiplier(save.needs)),
        social: scaled(11, socialGainMultiplier(save.needs)),
        happiness: 5,
        energy: -12,
        hunger: -8,
      },
      stats: { studySessions: save.stats.studySessions + 1 },
      relationships: { chidi: 4, amara: 4 },
      title: 'Study group survived',
      body: 'Academic +14, social +11. Nobody actually finished the question.',
    }),
  },
  {
    id: 'revise_theatre',
    location: 'lecture',
    label: 'Revise in the empty theatre',
    blurb: 'Quiet seats, cold room, real progress.',
    icon: 'book',
    minutes: 75,
    requiresEnergy: 8,
    run: (save) => ({
      needs: {
        academic: scaled(11, academicGainMultiplier(save.needs)),
        energy: -11,
        hunger: -7,
        happiness: -2,
      },
      stats: { studySessions: save.stats.studySessions + 1 },
      title: 'Revision done',
      body: 'Academic +11. The silence was suspiciously productive.',
    }),
  },

  // ------------------------------------------------------------------ library
  {
    id: 'study_library',
    location: 'library',
    label: 'Study session',
    blurb: 'Ninety focused minutes in the reading room.',
    icon: 'book',
    minutes: 90,
    requiresEnergy: 8,
    run: (save) => ({
      needs: {
        academic: scaled(15, academicGainMultiplier(save.needs)),
        energy: -12,
        hunger: -8,
        happiness: 1,
      },
      stats: { studySessions: save.stats.studySessions + 1 },
      title: 'Library session complete',
      body: 'Academic +15. Ngozi nodded approvingly.',
    }),
  },
  {
    id: 'deep_research',
    location: 'library',
    label: 'Deep research (3 hrs)',
    blurb: 'Past questions, journals and a serious academic jump.',
    icon: 'search',
    minutes: 180,
    requiresEnergy: 24,
    run: (save) => ({
      needs: {
        academic: scaled(28, academicGainMultiplier(save.needs)),
        energy: -26,
        hunger: -16,
        happiness: -4,
      },
      stats: { studySessions: save.stats.studySessions + 2 },
      title: 'Deep research done',
      body: 'Academic +28. Your eyes are dry but your CGPA is grateful.',
    }),
  },
  {
    id: 'borrow_books',
    location: 'library',
    label: 'Borrow reference books',
    blurb: 'Librarian-approved reading list for the semester.',
    icon: 'bookmark',
    minutes: 20,
    run: () => ({
      needs: { academic: 6 },
      title: 'Books borrowed',
      body: 'Academic +6 and a nice stack for your desk.',
    }),
  },
  {
    id: 'library_shift',
    location: 'library',
    label: 'Library assistant shift',
    blurb: 'Shelve returns and earn ₦3,000. Two shifts per day.',
    icon: 'briefcase',
    minutes: 120,
    requiresEnergy: 14,
    blocked: (save) => jobPayBlocked(save),
    run: (save) => ({
      balance: 3_000,
      needs: { energy: -16, academic: 5, happiness: -1, hunger: -8 },
      stats: jobStats(save),
      eventChance: 0.25,
      sfx: 'reward',
      title: 'Shift done',
      body: '₦3,000 earned. Very quiet, very repetitive, very worth it.',
    }),
  },
  {
    id: 'library_students',
    location: 'library',
    label: 'Chat with students at the tables',
    blurb: 'A sociable twenty-five minutes between readings.',
    icon: 'users',
    minutes: 25,
    run: (save) => ({
      needs: {
        social: scaled(11, socialGainMultiplier(save.needs)),
        happiness: 4,
        academic: 2,
      },
      relationships: { ngozi: 5, blessing: 5 },
      title: 'Table talk',
      body: 'Social +11. You now know three exam rumours.',
    }),
  },

  // ------------------------------------------------------------------- sports
  {
    id: 'workout',
    location: 'sports',
    label: 'Work out at the gym',
    blurb: 'First session each day earns a ₦900 sports stipend.',
    icon: 'dumbbell',
    minutes: 60,
    requiresEnergy: 14,
    run: (save) => ({
      balance: save.stats.lastWorkoutDay === save.clock.day ? 0 : 900,
      needs: { energy: -14, happiness: 9, hygiene: -12, hunger: -10 },
      stats: { lastWorkoutDay: save.clock.day },
      title: save.stats.lastWorkoutDay === save.clock.day ? 'Extra reps' : 'Gym session done',
      body:
        save.stats.lastWorkoutDay === save.clock.day
          ? 'Happiness +9. The stipend is once a day.'
          : 'Happiness +9 and ₦900 sports stipend.',
    }),
  },
  {
    id: 'join_match',
    location: 'sports',
    label: 'Join a football match',
    blurb: 'Ninety minutes of proper campus football.',
    icon: 'trophy',
    minutes: 90,
    requiresEnergy: 20,
    run: (save) => ({
      needs: { energy: -20, happiness: 14, social: scaled(13, socialGainMultiplier(save.needs)), hunger: -12, hygiene: -14 },
      relationships: { tunde: 6 },
      stats: { hangouts: save.stats.hangouts + 1 },
      eventChance: 0.4,
      title: 'Match played',
      body: 'Happiness +14 and social +13. Final score is disputed.',
    }),
  },
  {
    id: 'coach_session',
    location: 'sports',
    label: 'Train with Tunde',
    blurb: 'Personal drills from the loudest man on campus.',
    icon: 'dumbbell',
    minutes: 45,
    requiresEnergy: 10,
    run: (save) => ({
      needs: { happiness: 7, social: scaled(8, socialGainMultiplier(save.needs)), energy: -10, hygiene: -8 },
      relationships: { tunde: 9 },
      title: 'Coached by Tunde',
      body: 'Tunde likes you. Your hamstrings do not.',
    }),
  },
  {
    id: 'ref_match',
    location: 'sports',
    label: 'Ref a junior match',
    blurb: 'Officiate a hostel match for ₦2,000.',
    icon: 'briefcase',
    minutes: 60,
    requiresEnergy: 10,
    blocked: (save) => jobPayBlocked(save),
    run: (save) => ({
      balance: 2_000,
      needs: { energy: -12, social: 6, happiness: 2 },
      stats: jobStats(save),
      sfx: 'reward',
      title: 'Whistle blown',
      body: '₦2,000 earned. Everyone disagreed with every decision.',
    }),
  },

  // --------------------------------------------------------------------- shop
  {
    id: 'browse_shop',
    location: 'shop',
    label: 'Browse the shelves',
    blurb: 'Open the Campus Mart: outfits, room upgrades, snacks and gifts.',
    icon: 'cart',
    minutes: 0,
    run: () => ({
      panel: 'shop',
      title: 'Campus Mart',
      body: 'Buying something changes your look, your room or your stock.',
    }),
  },
  {
    id: 'shop_shift',
    location: 'shop',
    label: 'Take a cashier shift',
    blurb: '₦3,200 for two hours on the till.',
    icon: 'briefcase',
    minutes: 120,
    requiresEnergy: 15,
    blocked: (save) => jobPayBlocked(save),
    run: (save) => ({
      balance: 3_200,
      needs: { energy: -17, social: 6, happiness: -2, hunger: -8 },
      stats: jobStats(save),
      relationships: { uche: 5 },
      eventChance: 0.35,
      sfx: 'reward',
      title: 'Shift on the till',
      body: '₦3,200 earned. Uche says you have the right attitude.',
    }),
  },
  {
    id: 'shop_gist',
    location: 'shop',
    label: 'Gist with Uche the cashier',
    blurb: 'He knows every hostel rumour before it happens.',
    icon: 'users',
    minutes: 15,
    run: (save) => ({
      needs: { social: scaled(7, socialGainMultiplier(save.needs)), happiness: 3 },
      relationships: { uche: 7 },
      title: 'Rumour acquired',
      body: 'Social +7. You now owe Uche nothing.',
    }),
  },

  // ------------------------------------------------------------------ hangout
  {
    id: 'hangout_friends',
    location: 'hangout',
    label: 'Chill with friends',
    blurb: 'Drinks and small chops for ₦1,500, two good hours.',
    icon: 'users',
    minutes: 120,
    cost: 1_500,
    blocked: (save) => canAfford(save, 1_500),
    run: (save) => ({
      balance: -1_500,
      needs: {
        social: scaled(19, socialGainMultiplier(save.needs)),
        happiness: 14,
        energy: -8,
      },
      stats: { hangouts: save.stats.hangouts + 1 },
      relationships: { blessing: 6, emeka: 6, femi: 6 },
      eventChance: 0.45,
      sfx: 'buy',
      title: 'Pavilion evening',
      body: 'Social +19, happiness +14. Nobody wanted to leave.',
    }),
  },
  {
    id: 'table_tennis',
    location: 'hangout',
    label: 'Table tennis tournament',
    blurb: '₦500 entry fee, winner takes the bragging rights.',
    icon: 'trophy',
    minutes: 60,
    requiresEnergy: 8,
    blocked: (save) => canAfford(save, 500),
    run: (save) => ({
      balance: -500,
      needs: { happiness: 11, social: scaled(9, socialGainMultiplier(save.needs)), energy: -8, hygiene: -6 },
      stats: { hangouts: save.stats.hangouts + 1 },
      relationships: { femi: 5 },
      title: 'Tournament over',
      body: 'Happiness +11. You lost the final but won the crowd.',
    }),
  },
  {
    id: 'open_mic',
    location: 'hangout',
    label: 'Perform at open mic night',
    blurb: 'Evening only. Get on the mic and let the crowd decide.',
    icon: 'music',
    minutes: 90,
    requiresEnergy: 8,
    blocked: (save, clock) => {
      if (!isWithinHours(clock.hour, 17, 24)) return 'Open mic starts at 17:00.'
      return canAfford(save, 800)
    },
    run: (save) => ({
      balance: -800,
      needs: { happiness: 18, social: scaled(15, socialGainMultiplier(save.needs)), energy: -9 },
      stats: { hangouts: save.stats.hangouts + 1 },
      relationships: { emeka: 8, blessing: 6 },
      eventChance: 0.4,
      title: 'You performed!',
      body: 'Happiness +18. Somebody filmed it. It is already in the group chat.',
    }),
  },
  {
    id: 'board_games',
    location: 'hangout',
    label: 'Board games and gist',
    blurb: 'Whot, ludo and extremely loud arguing. Free.',
    icon: 'sparkles',
    minutes: 60,
    run: (save) => ({
      needs: { social: scaled(12, socialGainMultiplier(save.needs)), happiness: 9, energy: -5 },
      relationships: { femi: 5, emeka: 5 },
      title: 'Games night',
      body: 'Social +12, happiness +9. Femi cheats at Whot.',
    }),
  },

  // -------------------------------------------------------------------- event
  {
    id: 'attend_event',
    location: 'event',
    label: 'Join the running campus event',
    blurb: 'Only available while a scheduled event is happening.',
    icon: 'party',
    minutes: 150,
    blocked: (save, clock) => {
      if (!currentCampusEvent(clock)) return `Nothing on now. Next event: ${nextEventLabel(clock)}`
      return canAfford(save, 500)
    },
    run: (save) => ({
      balance: -500,
      needs: { happiness: 20, social: scaled(17, socialGainMultiplier(save.needs)), academic: 2, energy: -10 },
      stats: { eventsExperienced: save.stats.eventsExperienced + 1, hangouts: save.stats.hangouts + 1 },
      title: 'Event attended',
      body: 'Happiness +20, social +17. Worth the ₦500 gate fee.',
    }),
  },
  {
    id: 'volunteer_event',
    location: 'event',
    label: 'Volunteer at the event',
    blurb: 'Work the stands for ₦2,500 and serious goodwill.',
    icon: 'briefcase',
    minutes: 120,
    requiresEnergy: 14,
    blocked: (save, clock) => {
      if (!currentCampusEvent(clock)) return 'Volunteer slots only open during an event.'
      return jobPayBlocked(save)
    },
    run: (save) => ({
      balance: 2_500,
      needs: { social: scaled(13, socialGainMultiplier(save.needs)), happiness: 9, energy: -14, hunger: -8 },
      stats: { ...jobStats(save), eventsExperienced: save.stats.eventsExperienced + 1 },
      sfx: 'reward',
      title: 'Volunteer shift done',
      body: '₦2,500 earned and everybody saw you helping.',
    }),
  },
  {
    id: 'network_crowd',
    location: 'event',
    label: 'Network with the crowd',
    blurb: 'Thirty minutes of handshakes and useful names.',
    icon: 'users',
    minutes: 30,
    run: (save) => ({
      needs: { social: scaled(13, socialGainMultiplier(save.needs)), happiness: 5 },
      relationships: { chidi: 5, emeka: 5, blessing: 4 },
      title: 'Networking done',
      body: 'Social +13. You collected three names and one promise.',
    }),
  },
  {
    id: 'perform_stage',
    location: 'event',
    label: 'Perform on the open stage',
    blurb: 'Needs decent mood. The crowd sprays ₦1,800 if you show out.',
    icon: 'music',
    minutes: 60,
    requiresEnergy: 10,
    blocked: (save, clock) => {
      if (!currentCampusEvent(clock)) return 'The stage only opens during an event.'
      if (save.needs.happiness < 40) return 'You are not in the mood to perform right now.'
      return null
    },
    run: (save) => ({
      balance: 1_800,
      needs: { happiness: 15, social: scaled(14, socialGainMultiplier(save.needs)), energy: -10 },
      stats: { eventsExperienced: save.stats.eventsExperienced + 1 },
      sfx: 'reward',
      title: 'Stage performance',
      body: '₦1,800 from the crowd. Happiness +15.',
    }),
  },
]

/** Human label for the next scheduled campus event, used in blocked messages. */
function nextEventLabel(clock: Clock): string {
  const next = nextCampusEvent(clock)
  if (!next) return 'check the schedule panel'
  const hh = String(next.entry.startHour).padStart(2, '0')
  return `${next.entry.title} · ${weekdayName(next.day)} ${hh}:00`
}

export const ACTIVITY_BY_ID: Record<string, ActivityDef> = ACTIVITIES.reduce<Record<string, ActivityDef>>(
  (acc, activity) => {
    acc[activity.id] = activity
    return acc
  },
  {},
)

export function activitiesFor(location: LocationId): ActivityDef[] {
  return ACTIVITIES.filter((activity) => activity.location === location)
}

export function activityMinutesLabel(activity: ActivityDef): string {
  return activity.minutes > 0 ? formatDuration(activity.minutes) : 'Instant'
}
