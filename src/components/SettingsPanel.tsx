import { AlertTriangle, RotateCcw, Settings, Volume2, VolumeX } from 'lucide-react'
import { useState } from 'react'
import type { Settings as GameSettings } from '../types'
import { playSfx } from '../game/audio'
import { DEFAULT_SETTINGS } from '../game/constants'
import { useGame } from '../game/GameState'
import { Modal } from './ui'

interface SettingsPanelProps {
  embedded?: boolean
  onClose?: () => void
}

export function SettingsPanel({ embedded = false, onClose }: SettingsPanelProps) {
  const save = useGame((state) => state.save)
  const updateSettings = useGame((state) => state.updateSettings)
  const resetSave = useGame((state) => state.resetSave)
  const setPanel = useGame((state) => state.setPanel)
  const [confirmReset, setConfirmReset] = useState(false)

  const settings: GameSettings = save?.settings ?? { ...DEFAULT_SETTINGS }

  const body = (
    <div className="grid gap-5">
      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          {settings.muted ? <VolumeX size={14} /> : <Volume2 size={14} />} Audio
        </h3>
        <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
          <label className="flex items-center justify-between gap-4 text-sm text-slate-200">
            <span>Master volume</span>
            <span className="w-10 text-right text-xs font-semibold text-slate-300">
              {Math.round(settings.masterVolume * 100)}%
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.masterVolume}
            onChange={(event) => updateSettings({ masterVolume: Number(event.target.value) })}
            className="mt-2 w-full accent-violet-500"
          />
          <button
            type="button"
            className={`mt-3 ${settings.muted ? 'btn-gold' : 'btn-ghost'} !py-1.5 !text-xs`}
            onClick={() => {
              updateSettings({ muted: !settings.muted })
              if (settings.muted) playSfx('click')
            }}
          >
            {settings.muted ? 'Unmute audio' : 'Mute audio'}
          </button>
          <p className="mt-2 text-[11px] text-slate-400">
            All sound effects are generated in the browser — no audio files to download.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-violet-300">Interface</h3>
        <div className="grid gap-2">
          <Toggle
            label="Scene animations and transitions"
            value={settings.animations}
            onChange={(value) => updateSettings({ animations: value })}
          />
          <Toggle
            label="Show hints and campus notes"
            value={settings.showTips}
            onChange={(value) => updateSettings({ showTips: value })}
          />
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Turning animations off makes every scene change instant, which is easier on older devices.
        </p>
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-300">
          <AlertTriangle size={14} /> Save data
        </h3>
        <div className="rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-3">
          <p className="text-[11px] text-slate-300">
            Your progress is stored on this device only. Resetting deletes your character, lifestyle,
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
              <button
                type="button"
                className="btn-ghost !py-1.5 !text-xs"
                onClick={() => setConfirmReset(false)}
              >
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
      </section>
    </div>
  )

  if (embedded) return body

  return (
    <Modal
      title="Settings"
      subtitle="Audio, interface and save data"
      icon={<Settings size={20} />}
      onClose={() => {
        onClose?.()
        setPanel(null)
      }}
    >
      {body}
    </Modal>
  )
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
    >
      <span>{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-violet-600' : 'bg-slate-700'}`}>
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
            value ? 'left-[1.4rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  )
}
