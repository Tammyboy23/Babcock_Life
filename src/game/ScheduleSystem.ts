import type { Clock, LocationId } from '../types'
import { formatClock, weekdayIndex, weekdayName } from './timeState'

export type ScheduleKind = 'lecture' | 'study' | 'social' | 'event' | 'chapel' | 'sports'

export interface ScheduleEntry {
  id: string
  title: string
  kind: ScheduleKind
  location: LocationId
  /** 0 = Monday ... 6 = Sunday. */
  weekday: number
  startHour: number
  endHour: number
  detail: string
}

export const SCHEDULE: ScheduleEntry[] = [
  {
    id: 'csc201-mon',
    title: 'CSC 201 — Data Structures',
    kind: 'lecture',
    location: 'lecture',
    weekday: 0,
    startHour: 9,
    endHour: 11,
    detail: 'Dr. Adeyemi. Attendance is taken, and she notices.',
  },
  {
    id: 'library-block-mon',
    title: 'Library reading block',
    kind: 'study',
    location: 'library',
    weekday: 0,
    startHour: 14,
    endHour: 16,
    detail: 'Quiet hours. Bring your own charger.',
  },
  {
    id: 'court-mon',
    title: 'Basketball practice',
    kind: 'sports',
    location: 'sports',
    weekday: 0,
    startHour: 16,
    endHour: 18,
    detail: 'Tunde runs drills whether you are ready or not.',
  },
  {
    id: 'acc210-tue',
    title: 'ACC 210 — Cost Accounting',
    kind: 'lecture',
    location: 'lecture',
    weekday: 1,
    startHour: 10,
    endHour: 12,
    detail: 'The lecturer starts exactly on the hour. Exactly.',
  },
  {
    id: 'group-tue',
    title: 'Study group session',
    kind: 'study',
    location: 'library',
    weekday: 1,
    startHour: 15,
    endHour: 17,
    detail: 'Group four always brings snacks and never brings notes.',
  },
  {
    id: 'openmic-tue',
    title: 'Open mic night',
    kind: 'social',
    location: 'hangout',
    weekday: 1,
    startHour: 19,
    endHour: 22,
    detail: 'Poetry, afrobeats and one guy who only sings Burna Boy.',
  },
  {
    id: 'csc201-wed',
    title: 'CSC 201 — Tutorial',
    kind: 'lecture',
    location: 'lecture',
    weekday: 2,
    startHour: 9,
    endHour: 11,
    detail: 'Tutorial class. Chidi says questions are free, answers are not.',
  },
  {
    id: 'career-wed',
    title: 'Career fair talk',
    kind: 'event',
    location: 'event',
    weekday: 2,
    startHour: 13,
    endHour: 16,
    detail: 'Recruiters, free tote bags and brutal handshake practice.',
  },
  {
    id: 'match-wed',
    title: 'Inter-hostel football match',
    kind: 'sports',
    location: 'sports',
    weekday: 2,
    startHour: 16,
    endHour: 18,
    detail: 'Sapphire versus Amethyst. Bragging rights only.',
  },
  {
    id: 'mat202-thu',
    title: 'MAT 202 — Linear Algebra',
    kind: 'lecture',
    location: 'lecture',
    weekday: 3,
    startHour: 8,
    endHour: 10,
    detail: 'Eight a.m. lecture. Chapel is closer than your bed.',
  },
  {
    id: 'research-thu',
    title: 'Research clinic',
    kind: 'study',
    location: 'library',
    weekday: 3,
    startHour: 14,
    endHour: 16,
    detail: 'Reference books, past questions and very cold AC.',
  },
  {
    id: 'movie-thu',
    title: 'Pavilion movie night',
    kind: 'social',
    location: 'hangout',
    weekday: 3,
    startHour: 18,
    endHour: 21,
    detail: 'Projector, plastic chairs, everyone commenting the whole film.',
  },
  {
    id: 'chapel-fri',
    title: 'Chapel service',
    kind: 'chapel',
    location: 'event',
    weekday: 4,
    startHour: 8,
    endHour: 9,
    detail: 'Attendance registers are a real thing here.',
  },
  {
    id: 'csc301-fri',
    title: 'CSC 301 — Software Engineering',
    kind: 'lecture',
    location: 'lecture',
    weekday: 4,
    startHour: 11,
    endHour: 13,
    detail: 'Project groups get announced. Choose wisely.',
  },
  {
    id: 'student-week-fri',
    title: 'Student Week kickoff party',
    kind: 'event',
    location: 'event',
    weekday: 4,
    startHour: 18,
    endHour: 23,
    detail: 'DJ, suya stand and the entire faculty pretending they cannot see.',
  },
  {
    id: 'festival-sat',
    title: 'Sports festival',
    kind: 'event',
    location: 'event',
    weekday: 5,
    startHour: 10,
    endHour: 14,
    detail: 'Relay races, tug of war and too much jollof afterwards.',
  },
  {
    id: 'talent-sat',
    title: 'Talent showcase',
    kind: 'social',
    location: 'hangout',
    weekday: 5,
    startHour: 17,
    endHour: 22,
    detail: 'The one night every hostel has a star.',
  },
  {
    id: 'chapel-sun',
    title: 'Sunday service',
    kind: 'chapel',
    location: 'event',
    weekday: 6,
    startHour: 8,
    endHour: 10,
    detail: 'The choir is genuinely good. Go early for a seat.',
  },
  {
    id: 'sunday-chill',
    title: 'Sunday chill at the pavilion',
    kind: 'social',
    location: 'hangout',
    weekday: 6,
    startHour: 15,
    endHour: 20,
    detail: 'Board games, gist and nobody doing assignments.',
  },
]

export function scheduleForDay(day: number): ScheduleEntry[] {
  const weekday = weekdayIndex(day)
  return SCHEDULE.filter((entry) => entry.weekday === weekday).sort((a, b) => a.startHour - b.startHour)
}

/** The scheduled activity happening right now, if any. */
export function currentEntry(clock: Clock): ScheduleEntry | null {
  return (
    scheduleForDay(clock.day).find(
      (entry) => clock.hour >= entry.startHour && clock.hour < entry.endHour,
    ) ?? null
  )
}

export function currentLecture(clock: Clock): ScheduleEntry | null {
  const entry = currentEntry(clock)
  return entry && entry.kind === 'lecture' ? entry : null
}

/** The next scheduled activities after the current time. */
export function upcomingEntries(
  clock: Clock,
  count = 4,
): { entry: ScheduleEntry; day: number; startsInHours: number }[] {
  const list: { entry: ScheduleEntry; day: number; startsInHours: number }[] = []
  for (let offset = 0; offset < 8 && list.length < count; offset += 1) {
    const day = clock.day + offset
    for (const entry of scheduleForDay(day)) {
      const startsInHours = offset * 24 + entry.startHour - clock.hour
      if (startsInHours < -0.01) continue
      list.push({ entry, day, startsInHours })
      if (list.length >= count) break
    }
  }
  return list
}

export function nextEntryLabel(clock: Clock): string {
  const [next] = upcomingEntries(clock, 1)
  if (!next) return 'Nothing scheduled'
  const hours = next.startsInHours
  const when =
    hours < 1
      ? 'now'
      : hours < 24
        ? `in ${Math.round(hours)} hr`
        : `${weekdayName(next.day)} ${formatClock(next.entry.startHour)}`
  return `${next.entry.title} · ${when}`
}

export function entriesToday(clock: Clock): ScheduleEntry[] {
  const list = scheduleForDay(clock.day)
  const phaseEntries = list.filter((entry) => entry.endHour > clock.hour)
  return phaseEntries.length > 0 ? phaseEntries : list
}

/** True when a campus event (concert, fair, party) is running right now. */
export function currentCampusEvent(clock: Clock): ScheduleEntry | null {
  const entry = currentEntry(clock)
  return entry && entry.kind === 'event' ? entry : null
}

export function nextCampusEvent(
  clock: Clock,
): { entry: ScheduleEntry; day: number; startsInHours: number } | null {
  return upcomingEntries(clock, 8).find((item) => item.entry.kind === 'event') ?? null
}
