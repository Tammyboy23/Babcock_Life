import { MapPin, X } from 'lucide-react'
import { LOCATION_ORDER } from '../game/constants'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import { npcsIn } from '../game/npcs'
import { formatClock, isWithinHours } from '../game/timeState'
import type { LocationId } from '../types'
import { SceneIcon } from './scenes'

const LINKS: [LocationId, LocationId][] = [
  ['hostel', 'cafeteria'],
  ['hostel', 'sports'],
  ['cafeteria', 'lecture'],
  ['cafeteria', 'shop'],
  ['lecture', 'library'],
  ['shop', 'hangout'],
  ['library', 'hangout'],
  ['cafeteria', 'event'],
  ['event', 'sports'],
]

export function CampusMapPanel() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const travelTo = useGame((state) => state.travelTo)

  if (!save) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-2 sm:p-4">
      <button
        type="button"
        aria-label="Close map"
        className="absolute inset-0 cursor-default bg-slate-950/70 backdrop-blur-sm"
        onClick={() => setPanel(null)}
      />
      <div className="panel relative flex max-h-full w-full max-w-4xl animate-pop-in flex-col overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
              <MapPin size={20} />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white">Campus Map</h2>
              <p className="text-[11px] text-slate-400">
                Tap a marker to travel. You are at {LOCATIONS[save.locationId].name}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={() => setPanel(null)}
          >
            <X size={18} />
          </button>
        </header>

        <div className="scroll-thin flex-1 overflow-y-auto px-4 py-4">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/40 via-emerald-950/60 to-slate-950">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
              <g stroke="rgba(203,213,225,0.35)" strokeWidth="1" strokeDasharray="3 2">
                {LINKS.map(([from, to]) => (
                  <line
                    key={`${from}-${to}`}
                    x1={LOCATIONS[from].mapX}
                    y1={LOCATIONS[from].mapY}
                    x2={LOCATIONS[to].mapX}
                    y2={LOCATIONS[to].mapY}
                  />
                ))}
              </g>
              <circle cx="50" cy="50" r="20" fill="rgba(74,222,128,0.08)" />
              <circle cx="50" cy="50" r="30" fill="rgba(74,222,128,0.05)" />
            </svg>

            {LOCATION_ORDER.map((id) => {
              const location = LOCATIONS[id]
              const here = save.locationId === id
              const open = isWithinHours(save.clock.hour, location.open[0], location.open[1])
              const met = npcsIn(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    travelTo(id)
                    if (!here) setPanel(null)
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border px-2 py-1.5 text-left text-[11px] shadow-lg backdrop-blur transition ${
                    here
                      ? 'border-amber-300/80 bg-amber-400/25 text-amber-50'
                      : open
                        ? 'border-white/20 bg-slate-950/80 text-slate-100 hover:border-violet-300/70 hover:bg-violet-600/70'
                        : 'border-rose-400/30 bg-slate-950/80 text-rose-100'
                  }`}
                  style={{ left: `${location.mapX}%`, top: `${location.mapY}%` }}
                >
                  <span className="flex items-center gap-1.5 font-bold">
                    <SceneIcon name={here ? 'map' : 'footprints'} size={12} />
                    {location.short}
                  </span>
                  <span className="mt-0.5 block text-[10px] font-medium opacity-90">
                    {here ? 'You are here' : open ? `${location.travelMinutes} min walk` : 'Closed now'}
                  </span>
                  {met.length > 0 && (
                    <span className="mt-0.5 block text-[9px] opacity-80">
                      {met.length} student{met.length > 1 ? 's' : ''} around
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {LOCATION_ORDER.map((id) => {
              const location = LOCATIONS[id]
              const here = save.locationId === id
              const open = isWithinHours(save.clock.hour, location.open[0], location.open[1])
              return (
                <button
                  key={`row-${id}`}
                  type="button"
                  onClick={() => {
                    travelTo(id)
                    if (!here) setPanel(null)
                  }}
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-left transition hover:border-violet-400/50 hover:bg-violet-500/10"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-white">{location.name}</span>
                    <span className="block truncate text-[10px] text-slate-400">{location.blurb}</span>
                  </span>
                  <span className="shrink-0 text-right text-[10px] font-semibold">
                    <span className="block text-slate-300">
                      {here ? 'Here' : `${location.travelMinutes} min`}
                    </span>
                    <span className={open ? 'text-emerald-300' : 'text-rose-300'}>
                      {formatClock(location.open[0])} – {formatClock(location.open[1] % 24)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
