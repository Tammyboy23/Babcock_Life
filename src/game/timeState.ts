import type { Clock, TimePhase } from '../types'

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

/** Day 1 is a Monday. */
export function weekdayIndex(day: number): number {
  return (((Math.floor(day) - 1) % 7) + 7) % 7
}

export function weekdayName(day: number): string {
  return WEEKDAYS[weekdayIndex(day)]
}

export function isWeekend(day: number): boolean {
  return weekdayIndex(day) >= 5
}

export function formatClock(hour: number): string {
  const wrapped = ((hour % 24) + 24) % 24
  const totalMinutes = Math.round(wrapped * 60) % (24 * 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

export function phaseOf(hour: number): TimePhase {
  const wrapped = ((hour % 24) + 24) % 24
  if (wrapped >= 5 && wrapped < 12) return 'Morning'
  if (wrapped >= 12 && wrapped < 17) return 'Afternoon'
  if (wrapped >= 17 && wrapped < 21) return 'Evening'
  return 'Night'
}

export function isNight(hour: number): boolean {
  return phaseOf(hour) === 'Night'
}

export function greetingFor(hour: number): string {
  const phase = phaseOf(hour)
  if (phase === 'Morning') return 'Good morning'
  if (phase === 'Afternoon') return 'Good afternoon'
  if (phase === 'Evening') return 'Good evening'
  return 'Still awake'
}

export interface AdvancedClock {
  clock: Clock
  /** Whole days that rolled over while time advanced. */
  daysPassed: number
}

/** Advances the clock by `minutes`, wrapping into new days as needed. */
export function addMinutes(clock: Clock, minutes: number): AdvancedClock {
  const total = clock.hour * 60 + minutes
  const daysPassed = Math.floor(total / (24 * 60))
  const minuteOfDay = ((total % (24 * 60)) + 24 * 60) % (24 * 60)
  return {
    clock: { day: clock.day + daysPassed, hour: minuteOfDay / 60 },
    daysPassed,
  }
}

/** Sleeping always lands on the next morning, matching how hostel life works. */
export function nextMorning(clock: Clock, atHour = 7): Clock {
  return { day: clock.day + 1, hour: atHour }
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} min`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  if (rest === 0) return `${hours} hr`
  return `${hours} hr ${rest} min`
}

/** Minutes from now until `hour` today (or tomorrow morning when already past). */
export function minutesUntil(clock: Clock, hour: number): number {
  const diff = hour - clock.hour
  return diff >= 0 ? diff * 60 : (diff + 24) * 60
}

export function isWithinHours(hour: number, open: number, close: number): boolean {
  const wrapped = ((hour % 24) + 24) % 24
  if (open <= close) return wrapped >= open && wrapped < close
  // Overnight window, e.g. 20:00 -> 02:00
  return wrapped >= open || wrapped < close
}
