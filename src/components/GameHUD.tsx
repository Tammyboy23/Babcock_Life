import {
  BookOpen,
  CalendarDays,
  Ellipsis,
  Heart,
  Smartphone,
  Map as MapIcon,
  Package,
  Pause,
  Settings as SettingsIcon,
  Target,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import { formatClock, weekdayName } from '../game/timeState'
import { AvatarPortrait, SceneIcon } from './scenes'

const NAV = [
  { panel: 'map', label: 'Map', icon: MapIcon },
  { panel: 'schedule', label: 'Schedule', icon: CalendarDays },
  { panel: 'missions', label: 'Missions', icon: Target },
  { panel: 'relationships', label: 'People', icon: Heart },
  { panel: 'inventory', label: 'Bag', icon: Package },
  { panel: 'shop', label: 'Shop', icon: BookOpen },
  { panel: 'character', label: 'Profile', icon: UserRound },
] as const

export function GameHUD() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const togglePause = useGame((state) => state.togglePause)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!save) return null

  const info = LIFESTYLE_INFO[save.lifestyle]
  const location = LOCATIONS[save.locationId]

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-2 sm:p-3">
      <div className="panel pointer-events-auto mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-2.5 py-1.5 sm:px-3">
        <div className="flex min-w-0 items-center gap-2">
          <AvatarPortrait
            look={{
              gender: save.gender,
              skinTone: save.profile.skinTone,
              hairStyle: save.profile.hairStyle,
              hairColor: save.profile.hairColor,
              outfitPrimary: info.accent,
              outfitSecondary: '#1e293b',
            }}
            size={32}
            ring={`${info.accent}88`}
          />
          <span className="max-w-20 truncate text-xs font-bold text-white sm:max-w-28">{save.profile.name}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-[10px] sm:gap-2">
          <span className="chip max-w-24 truncate !px-2 !py-1 !text-[10px] sm:max-w-none">
            <SceneIcon name="map" size={11} /> {location.short}
          </span>
          <span className="chip hidden !px-2 !py-1 !text-[10px] md:inline-flex">
            Day {save.clock.day} · {weekdayName(save.clock.day)} {formatClock(save.clock.hour)}
          </span>
          <span className="chip !px-2 !py-1 !text-[10px] font-bold text-amber-300">
            {formatMoney(save.balance)}
          </span>
        </div>

        <div className="ml-auto hidden shrink-0 items-center gap-1 sm:flex">
          {NAV.map((entry) => {
            const Icon = entry.icon
            return (
              <button
                key={entry.panel}
                type="button"
                onClick={() => setPanel(entry.panel)}
                className="btn-ghost !h-8 !w-8 !p-0"
                title={entry.label}
                aria-label={entry.label}
              >
                <Icon size={14} />
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setPanel('settings')}
            className="btn-ghost !h-8 !w-8 !p-0"
            title="Settings"
            aria-label="Settings"
          >
            <SettingsIcon size={14} />
          </button>
          <button
            type="button"
            onClick={() => togglePause()}
            className="btn-ghost !h-8 !w-8 !p-0"
            title="Pause (Esc)"
            aria-label="Pause"
          >
            <Pause size={14} />
          </button>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:hidden">
          <button
            type="button"
            onClick={() => setPanel('phone')}
            className="btn-ghost !h-8 !w-8 !p-0"
            title="Phone"
            aria-label="Phone"
          >
            <Smartphone size={15} />
          </button>
          <button
            type="button"
            onClick={() => setPanel('map')}
            className="btn-ghost !h-8 !w-8 !p-0"
            title="Campus map"
            aria-label="Campus map"
          >
            <MapIcon size={15} />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="btn-ghost !h-8 !w-8 !p-0"
            title="More game menus"
            aria-label="More game menus"
            aria-expanded={mobileMenuOpen}
          >
            <Ellipsis size={16} />
          </button>
        </div>
      </div>
      {mobileMenuOpen && (
        <div className="panel pointer-events-auto absolute right-2 top-[4.2rem] grid grid-cols-4 gap-1 p-2 sm:hidden">
          {NAV.filter((entry) => entry.panel !== 'map').map((entry) => {
            const Icon = entry.icon
            return (
              <button
                key={entry.panel}
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false)
                  setPanel(entry.panel)
                }}
                className="flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[9px] font-semibold text-slate-200 hover:bg-white/10"
                aria-label={entry.label}
              >
                <Icon size={15} />
                {entry.label}
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false)
              setPanel('settings')
            }}
            className="flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[9px] font-semibold text-slate-200 hover:bg-white/10"
            aria-label="Settings"
          >
            <SettingsIcon size={15} /> Settings
          </button>
          <button
            type="button"
            onClick={() => togglePause()}
            className="flex min-w-14 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[9px] font-semibold text-slate-200 hover:bg-white/10"
            aria-label="Pause"
          >
            <Pause size={15} /> Pause
          </button>
        </div>
      )}
    </div>
  )
}
