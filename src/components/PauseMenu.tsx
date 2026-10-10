import { useState } from 'react'
import { Play, RotateCcw, Save, Settings, Sparkles } from 'lucide-react'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import { moodLabel } from '../game/NeedsSystem'
import { completedMissionCount, MISSIONS } from '../game/MissionSystem'
import { formatClock, weekdayName } from '../game/timeState'
import { NeedsStrip } from './NeedsStrip'
import { SettingsPanel } from './SettingsPanel'
import { AvatarPortrait } from './scenes'

export function PauseMenu() {
  const paused = useGame((state) => state.paused)
  const save = useGame((state) => state.save)
  const setPaused = useGame((state) => state.setPaused)
  const returnToMenu = useGame((state) => state.returnToMenu)
  const resetSave = useGame((state) => state.resetSave)
  const [view, setView] = useState<'root' | 'settings'>('root')
  const [confirmReset, setConfirmReset] = useState(false)

  if (!paused || !save) return null

  const info = LIFESTYLE_INFO[save.lifestyle]
  const mood = moodLabel(save.needs)
  const done = completedMissionCount(save)

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-md">
      <div className="panel w-full max-w-lg animate-pop-in p-5">
        <header className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-violet-300">Paused</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-white">BABCOCK LIFE</h2>
        </header>

        {view === 'settings' ? (
          <div className="mt-5">
            <SettingsPanel embedded />
            <button type="button" className="btn-ghost mt-4 w-full" onClick={() => setView('root')}>
              Back
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
              <AvatarPortrait
                look={{
                  gender: save.gender,
                  skinTone: save.profile.skinTone,
                  hairStyle: save.profile.hairStyle,
                  hairColor: save.profile.hairColor,
                  outfitPrimary: info.accent,
                  outfitSecondary: '#1e293b',
                }}
                size={56}
                ring={`${info.accent}77`}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-base font-bold text-white">{save.profile.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest"
                    style={{ background: `${info.accent}22`, color: info.accent }}
                  >
                    {save.lifestyle}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {save.hostelName} · {mood.label}
                </p>
                <p className="text-[11px] text-slate-400">
                  {LOCATIONS[save.locationId].short} · Day {save.clock.day} ({weekdayName(save.clock.day)}){' '}
                  {formatClock(save.clock.hour)}
                </p>
              </div>
              <div className="ml-auto text-right">
                <div className="text-sm font-bold text-amber-300">{formatMoney(save.balance)}</div>
                <div className="text-[10px] text-slate-400">
                  {done}/{MISSIONS.length} missions
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/25 p-3">
              <NeedsStrip needs={save.needs} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button type="button" className="btn-primary" onClick={() => setPaused(false)}>
                <Play size={16} /> Resume
              </button>
              <button type="button" className="btn-ghost" onClick={() => setView('settings')}>
                <Settings size={16} /> Settings
              </button>
              <button type="button" className="btn-ghost sm:col-span-2" onClick={() => returnToMenu()}>
                <Save size={16} /> Save &amp; return to main menu
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-3">
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose-300">
                <Sparkles size={13} /> Save data
              </p>
              <p className="mt-1 text-[11px] text-slate-300">
                Progress is stored on this device. Resetting deletes your character, lifestyle,
                allowance, needs, relationships, inventory and missions permanently.
              </p>
              {confirmReset ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn !bg-rose-600 !text-white hover:!bg-rose-500 !py-1.5 !text-xs"
                    onClick={() => {
                      resetSave()
                      setConfirmReset(false)
                    }}
                  >
                    Yes, delete everything
                  </button>
                  <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-ghost mt-3 !py-1.5 !text-xs"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw size={14} /> Reset save
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
