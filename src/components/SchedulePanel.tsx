import { CalendarDays, PartyPopper } from 'lucide-react'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import {
  SCHEDULE,
  currentEntry,
  nextCampusEvent,
  scheduleForDay,
  upcomingEntries,
} from '../game/ScheduleSystem'
import { formatClock, formatDuration, weekdayName, WEEKDAYS } from '../game/timeState'
import { Modal } from './ui'
import { SceneIcon } from './scenes'

const KIND_TONE: Record<string, string> = {
  lecture: 'text-sky-200 border-sky-400/30 bg-sky-400/10',
  study: 'text-violet-200 border-violet-400/30 bg-violet-400/10',
  social: 'text-pink-200 border-pink-400/30 bg-pink-400/10',
  event: 'text-amber-200 border-amber-400/30 bg-amber-400/10',
  sports: 'text-emerald-200 border-emerald-400/30 bg-emerald-400/10',
  chapel: 'text-slate-200 border-slate-400/30 bg-slate-400/10',
}

const KIND_ICON: Record<string, string> = {
  lecture: 'graduation',
  study: 'book',
  social: 'music',
  event: 'party',
  sports: 'trophy',
  chapel: 'sparkles',
}

export function SchedulePanel() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const travelTo = useGame((state) => state.travelTo)
  const doActivity = useGame((state) => state.doActivity)

  if (!save) return null

  const today = scheduleForDay(save.clock.day)
  const live = currentEntry(save.clock)
  const upcoming = upcomingEntries(save.clock, 5)
  const nextEvent = nextCampusEvent(save.clock)

  return (
    <Modal
      title="University Schedule"
      subtitle={`Day ${save.clock.day} · ${weekdayName(save.clock.day)} · ${formatClock(save.clock.hour)}`}
      icon={<CalendarDays size={20} />}
      onClose={() => setPanel(null)}
      size="lg"
    >
      <section className="mb-5">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">Today</h3>
        {today.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-xs text-slate-400">
            Nothing scheduled today. Spend the time on needs, money or relationships.
          </p>
        ) : (
          <div className="grid gap-2">
            {today.map((entry) => {
              const isLive = live?.id === entry.id
              return (
                <div
                  key={entry.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                    isLive ? 'border-amber-300/60 bg-amber-400/10' : 'border-white/10 bg-white/5'
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span className={`mt-0.5 rounded-lg border px-1.5 py-1 ${KIND_TONE[entry.kind]}`}>
                      <SceneIcon name={KIND_ICON[entry.kind]} size={13} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{entry.title}</div>
                      <div className="text-[11px] text-slate-400">
                        {formatClock(entry.startHour)} – {formatClock(entry.endHour)} ·{' '}
                        {LOCATIONS[entry.location].short}
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-300">{entry.detail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isLive && <span className="chip text-amber-200">Happening now</span>}
                    <button
                      type="button"
                      className="btn-ghost !py-1.5 !text-[11px]"
                      onClick={() => {
                        travelTo(entry.location)
                        setPanel(null)
                      }}
                    >
                      Go there
                    </button>
                    {isLive && entry.kind === 'lecture' && (
                      <button
                        type="button"
                        className="btn-primary !py-1.5 !text-[11px]"
                        onClick={() => {
                          doActivity('attend_lecture')
                          setPanel(null)
                        }}
                      >
                        Attend
                      </button>
                    )}
                    {isLive && entry.kind === 'event' && (
                      <button
                        type="button"
                        className="btn-primary !py-1.5 !text-[11px]"
                        onClick={() => {
                          doActivity('attend_event')
                          setPanel(null)
                        }}
                      >
                        Join
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mb-5">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <PartyPopper size={14} /> Coming up
        </h3>
        <div className="grid gap-1.5 text-xs">
          {upcoming.map((item) => (
            <div
              key={`${item.entry.id}-${item.day}`}
              className="flex items-center justify-between gap-3 rounded-lg bg-black/25 px-3 py-1.5"
            >
              <span className="min-w-0 truncate text-slate-200">{item.entry.title}</span>
              <span className="shrink-0 text-[11px] text-slate-400">
                {weekdayName(item.day)} {formatClock(item.entry.startHour)} ·{' '}
                {item.startsInHours < 24
                  ? `in ${formatDuration(Math.max(0, item.startsInHours * 60))}`
                  : `${Math.round(item.startsInHours / 24)} day(s)`}
              </span>
            </div>
          ))}
        </div>
        {nextEvent && (
          <p className="mt-2 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-100">
            Next campus event: {nextEvent.entry.title} on {weekdayName(nextEvent.day)} at{' '}
            {formatClock(nextEvent.entry.startHour)} · {LOCATIONS[nextEvent.entry.location].short}
          </p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          The full week
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEEKDAYS.map((day, index) => {
            const entries = SCHEDULE.filter((entry) => entry.weekday === index).sort(
              (a, b) => a.startHour - b.startHour,
            )
            const isToday = index === ((save.clock.day - 1) % 7 + 7) % 7
            return (
              <div
                key={day}
                className={`rounded-xl border px-3 py-2 ${
                  isToday ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{day}</span>
                  {isToday && <span className="text-[10px] font-semibold text-violet-200">Today</span>}
                </div>
                <ul className="mt-1 grid gap-0.5 text-[11px] text-slate-300">
                  {entries.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate">{entry.title}</span>
                      <span className="shrink-0 text-slate-400">{formatClock(entry.startHour)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </section>
    </Modal>
  )
}
