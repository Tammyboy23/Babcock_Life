import { Clock, DoorOpen, Info, MapPin, Sparkles } from 'lucide-react'
import type { SaveData } from '../types'
import type { ActivityDef } from '../game/ActivitiesSystem'
import { activitiesFor, activityMinutesLabel } from '../game/ActivitiesSystem'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import { npcsIn } from '../game/npcs'
import { nextEntryLabel } from '../game/ScheduleSystem'
import { relationshipTier } from '../game/RelationshipSystem'
import { formatClock, formatDuration, isWithinHours, phaseOf } from '../game/timeState'
import { AvatarPortrait, SceneForLocation, SceneIcon } from './scenes'

interface ActivityStatus {
  ok: boolean
  reason?: string
}

function activityStatus(activity: ActivityDef, save: SaveData): ActivityStatus {
  const location = LOCATIONS[activity.location]
  if (!isWithinHours(save.clock.hour, location.open[0], location.open[1])) {
    return { ok: false, reason: `Closed (${formatClock(location.open[0])} – ${formatClock(location.open[1] % 24)})` }
  }
  if (activity.blocked) {
    const reason = activity.blocked(save, save.clock)
    if (reason) return { ok: false, reason }
  }
  if (activity.requiresEnergy && save.needs.energy < activity.requiresEnergy) {
    return { ok: false, reason: `Needs ${activity.requiresEnergy} energy` }
  }
  if (activity.cost && save.balance < activity.cost) {
    return { ok: false, reason: `Needs ${formatMoney(activity.cost)}` }
  }
  return { ok: true }
}

export function LocationView() {
  const save = useGame((state) => state.save)
  const doActivity = useGame((state) => state.doActivity)
  const openNpc = useGame((state) => state.openNpc)
  const setPanel = useGame((state) => state.setPanel)

  if (!save) return null

  const location = LOCATIONS[save.locationId]
  const phase = phaseOf(save.clock.hour)
  const activities = activitiesFor(save.locationId).filter(
    (activity) => !activity.visible || activity.visible(save, save.clock),
  )
  const students = npcsIn(save.locationId)
  const closed = !isWithinHours(save.clock.hour, location.open[0], location.open[1])

  return (
    <div className="flex flex-col gap-3">
      <SceneForLocation
        save={save}
        phase={phase}
        onActivity={doActivity}
        onNpc={openNpc}
        onTravel={() => setPanel('map')}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-2 backdrop-blur">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold text-white">{location.name}</h2>
          <p className="truncate text-[11px] text-slate-400">{location.blurb}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="chip">
            <Clock size={12} /> {formatClock(save.clock.hour)} · {phase}
          </span>
          <span className={`chip ${closed ? 'text-rose-200' : 'text-emerald-200'}`}>
            {closed ? 'Closed now' : `Open ${formatClock(location.open[0])} – ${formatClock(location.open[1] % 24)}`}
          </span>
          <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={() => setPanel('map')}>
            <MapPin size={14} /> Travel
          </button>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <section className="panel p-3">
          <header className="mb-2 flex items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              <Sparkles size={14} /> What you can do here
            </h3>
            <span className="text-[10px] text-slate-400">{activities.length} activities</span>
          </header>

          {closed && (
            <p className="mb-2 flex items-start gap-2 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100">
              <Info size={13} className="mt-0.5 shrink-0" />
              {location.short} is closed right now. Check your schedule, rest in your room, or travel
              somewhere that is open.
            </p>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            {activities.map((activity) => {
              const status = activityStatus(activity, save)
              return (
                <button
                  key={activity.id}
                  type="button"
                  disabled={!status.ok}
                  onClick={() => doActivity(activity.id)}
                  className={`flex h-full flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition ${
                    status.ok
                      ? 'border-white/10 bg-white/5 hover:border-violet-400/60 hover:bg-violet-500/10'
                      : 'cursor-not-allowed border-white/5 bg-black/30 opacity-60'
                  }`}
                >
                  <span className="flex w-full items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/20 text-violet-100">
                      <SceneIcon name={activity.icon} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                      {activity.label}
                    </span>
                  </span>
                  <span className="text-[11px] leading-snug text-slate-300">{activity.blurb}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-slate-300">
                      {activityMinutesLabel(activity)}
                    </span>
                    {activity.cost ? (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-200">
                        {formatMoney(activity.cost)}
                      </span>
                    ) : null}
                    {activity.requiresEnergy ? (
                      <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-emerald-200">
                        {activity.requiresEnergy} energy
                      </span>
                    ) : null}
                    {!status.ok && (
                      <span className="rounded-full bg-rose-500/15 px-2 py-0.5 text-rose-200">
                        {status.reason}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="grid gap-3">
          <div className="panel p-3">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              Students here
            </h3>
            {students.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 px-3 py-6 text-center text-xs text-slate-400">
                Nobody is around right now. Try the pavilion, the food court or the library.
              </p>
            ) : (
              <div className="grid gap-2">
                {students.map((npc) => {
                  const score = save.relationships[npc.id] ?? 0
                  const tier = relationshipTier(score)
                  return (
                    <button
                      key={npc.id}
                      type="button"
                      onClick={() => openNpc(npc.id)}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-violet-400/60 hover:bg-violet-500/10"
                    >
                      <AvatarPortrait
                        look={{
                          gender: npc.gender,
                          skinTone: npc.skinTone,
                          hairStyle: npc.hairStyle,
                          hairColor: npc.hairColor,
                          outfitPrimary: npc.outfitPrimary,
                          outfitSecondary: npc.outfitSecondary,
                        }}
                        size={44}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">{npc.name}</span>
                        <span className="block truncate text-[10px] text-slate-400">{npc.tag}</span>
                        <span className="mt-1 flex items-center gap-1.5">
                          <span className="relative h-1.5 w-16 overflow-hidden rounded-full bg-black/50">
                            <span
                              className="absolute inset-y-0 left-0 rounded-full"
                              style={{ width: `${score}%`, background: tier.tone }}
                            />
                          </span>
                          <span className="text-[10px] font-semibold" style={{ color: tier.tone }}>
                            {tier.label}
                          </span>
                        </span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-violet-300">
                        Talk
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="panel p-3 text-[11px] text-slate-300">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              {save.locationId === 'hostel' ? 'Room notes' : 'Campus notes'}
            </h3>
            {save.locationId === 'hostel' && (
              <p className="mb-2 flex items-start gap-2">
                <span
                  className="mt-0.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: LIFESTYLE_INFO[save.lifestyle].accent }}
                />
                <span>
                  <span className="font-semibold text-white">{save.lifestyle} room:</span>{' '}
                  {LIFESTYLE_INFO[save.lifestyle].room}
                </span>
              </p>
            )}
            <p className="flex items-start gap-2">
              <Clock size={13} className="mt-0.5 shrink-0 text-violet-300" />
              Next up: {nextEntryLabel(save.clock)}
            </p>
            <p className="mt-2 flex items-start gap-2">
              <DoorOpen size={13} className="mt-0.5 shrink-0 text-violet-300" />
              Walking anywhere on campus costs {formatDuration(LOCATIONS[save.locationId].travelMinutes || 8)}.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
