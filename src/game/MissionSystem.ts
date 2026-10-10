import type { MissionDef, MissionProgress, SaveData } from '../types'

export const MISSIONS: MissionDef[] = [
  {
    id: 'settle_in',
    title: 'Settle In',
    description:
      'First week energy. Get your bearings, feed yourself and sleep in your own bed.',
    objective: 'Check your schedule, eat a meal and sleep a night',
    steps: ['Check your schedule at the hostel desk', 'Eat something at the food court', 'Sleep a full night'],
    goal: 3,
    reward: 3_000,
    autoStart: true,
    completionHint: 'Use "Check your schedule" in your room, buy a meal at the food court and sleep.',
  },
  {
    id: 'campus_tour',
    title: 'Find Your Way',
    description:
      'Chidi insists nobody survives this campus without knowing where everything is. Prove him right.',
    objective: 'Visit 4 different campus locations',
    steps: ['Travel to 4 different locations from the campus map'],
    goal: 4,
    reward: 4_000,
    autoStart: true,
    completionHint: 'Open the campus map and travel somewhere new. Every unique place counts once.',
  },
  {
    id: 'meet_people',
    title: 'People Person',
    description: 'Four students, four names, four relationships worth having.',
    objective: 'Meet 4 students',
    steps: ['Introduce yourself to 4 different students'],
    goal: 4,
    reward: 4_500,
    autoStart: true,
    completionHint: 'Students appear inside locations — start a conversation and introduce yourself.',
  },
  {
    id: 'room_glow_up',
    title: 'Room Glow Up',
    description:
      'Ngozi says your room says a lot about you. Own two room upgrades and make it say something good.',
    objective: 'Install 2 furniture upgrades in your room',
    steps: ['Buy 2 room items from the Campus Mart'],
    goal: 2,
    reward: 6_000,
    autoStart: true,
    completionHint: 'Open the Campus Mart (or "Shop for room upgrades" in your room) and buy furniture.',
  },
  {
    id: 'emergency_fund',
    title: 'Emergency Fund',
    description:
      'Campus is expensive and surprises are free. Keep ₦150,000 in your balance at least once.',
    objective: 'Reach a balance of ₦150,000',
    steps: ['Save, work and complete missions until your balance hits ₦150,000'],
    goal: 1,
    reward: 5_000,
    autoStart: true,
    completionHint: 'Part-time shifts, event work and mission rewards all add up.',
  },
  {
    id: 'lecture_streak',
    title: 'Lecture Streak',
    description: 'Dr. Adeyemi says attendance is the cheapest way to raise a grade. Prove it.',
    objective: 'Attend 2 lectures',
    steps: ['Attend 2 scheduled lectures in the lecture theatre'],
    goal: 2,
    reward: 5_000,
    giver: 'dr-adeyemi',
    completionHint: 'Lectures are only attendable while scheduled — check the schedule panel.',
  },
  {
    id: 'hustle',
    title: 'Small Hustle',
    description:
      'Mama Ngozika: “Money does not fall from the sky, but it does fall at my counter.” Work two shifts.',
    objective: 'Complete 2 paid jobs',
    steps: ['Work 2 paid shifts (food court, library, mart, sports, events)'],
    goal: 2,
    reward: 5_000,
    giver: 'mama-ngozika',
    completionHint: 'Every location has at least one paid shift. Two shifts per day, maximum.',
  },
  {
    id: 'social_butterfly',
    title: 'Social Butterfly',
    description:
      'Blessing is convinced your network is your net worth. Two proper hangouts should convince you too.',
    objective: 'Hang out 2 times',
    steps: ['Chill with friends at the pavilion or attend 2 social activities'],
    goal: 2,
    reward: 5_500,
    giver: 'blessing',
    completionHint: 'Hangouts at the pavilion, matches, open mic nights and events all count.',
  },
  {
    id: 'grade_builder',
    title: 'Grade Builder',
    description: 'Push your academic progress to 75. Library sessions, lectures and study groups all count.',
    objective: 'Reach 75 academic progress',
    steps: ['Study until your academic stat reaches 75'],
    goal: 3,
    reward: 6_500,
    giver: 'dr-adeyemi',
    completionHint: 'Every 25 points of academic progress ticks one step of this mission.',
  },
]

export const MISSION_BY_ID: Record<string, MissionDef> = MISSIONS.reduce<Record<string, MissionDef>>(
  (acc, mission) => {
    acc[mission.id] = mission
    return acc
  },
  {},
)

export function initialMissionState(): Record<string, MissionProgress> {
  const state: Record<string, MissionProgress> = {}
  for (const mission of MISSIONS) {
    state[mission.id] = { status: mission.giver ? 'available' : 'active', counter: 0 }
  }
  return state
}

/** Mission progress is always recomputed from saved stats so it can never drift. */
export function computeCounter(missionId: string, save: SaveData): number {
  const stats = save.stats
  switch (missionId) {
    case 'settle_in':
      return (
        (stats.scheduleChecked ? 1 : 0) +
        (stats.mealsBought > 0 ? 1 : 0) +
        (stats.nightsSlept > 0 ? 1 : 0)
      )
    case 'campus_tour':
      return Math.min(4, stats.locationsVisited.length)
    case 'meet_people':
      return Math.min(4, stats.npcsTalked.length)
    case 'room_glow_up':
      return Math.min(2, stats.furniturePurchased)
    case 'emergency_fund':
      return Math.min(1, Math.floor(save.balance / 150_000))
    case 'lecture_streak':
      return Math.min(2, stats.lecturesAttended)
    case 'hustle':
      return Math.min(2, stats.jobsDone)
    case 'social_butterfly':
      return Math.min(2, stats.hangouts)
    case 'grade_builder':
      return Math.min(3, Math.floor(save.needs.academic / 25))
    default:
      return 0
  }
}

export interface MissionSnapshot {
  def: MissionDef
  progress: MissionProgress
  counter: number
}

export function missionSnapshots(save: SaveData): MissionSnapshot[] {
  return MISSIONS.map((def) => {
    const progress = save.missions[def.id] ?? { status: 'available' as const, counter: 0 }
    return { def, progress, counter: computeCounter(def.id, save) }
  })
}

export function activeMissionSummary(save: SaveData): MissionSnapshot | null {
  const active = missionSnapshots(save).filter((snapshot) => snapshot.progress.status === 'active')
  if (active.length === 0) return null
  return active.find((snapshot) => snapshot.counter > 0) ?? active[0]
}

export interface MissionCompletion {
  mission: MissionDef
  reward: number
}

/**
 * Recomputes every counter and completes any active mission whose goal is met.
 * Returns a new save object plus the missions that were completed by this pass.
 */
export function evaluateMissions(save: SaveData): { save: SaveData; completed: MissionCompletion[] } {
  const missions: Record<string, MissionProgress> = { ...save.missions }
  const completed: MissionCompletion[] = []

  for (const def of MISSIONS) {
    const current = missions[def.id] ?? { status: 'available' as const, counter: 0 }
    if (current.status === 'completed') continue

    const counter = computeCounter(def.id, save)
    if (current.status === 'active' && counter >= def.goal) {
      missions[def.id] = { status: 'completed', counter, completedAt: Date.now() }
      completed.push({ mission: def, reward: def.reward })
    } else {
      missions[def.id] = { status: current.status, counter, completedAt: current.completedAt }
    }
  }

  if (completed.length === 0) {
    const unchanged = MISSIONS.every((def) => {
      const before = save.missions[def.id]
      const after = missions[def.id]
      return before && after && before.status === after.status && before.counter === after.counter
    })
    if (unchanged) return { save, completed }
  }

  return { save: { ...save, missions }, completed }
}

export function missionOfNpc(npcId: string): MissionDef | undefined {
  return MISSIONS.find((mission) => mission.giver === npcId)
}

export function completedMissionCount(save: SaveData): number {
  return Object.values(save.missions).filter((entry) => entry.status === 'completed').length
}
