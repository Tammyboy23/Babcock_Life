import { useState } from 'react'
import { BookOpen, Play, RotateCcw, Settings as SettingsIcon, Sparkles, UserRound } from 'lucide-react'
import { playSfx, unlockAudio } from '../game/audio'
import { useGame } from '../game/GameState'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { LOCATIONS } from '../game/locations'
import { MISSIONS } from '../game/MissionSystem'
import { NEED_META, lowestNeeds } from '../game/NeedsSystem'
import { formatClock, weekdayName } from '../game/timeState'
import { SettingsPanel } from './SettingsPanel'
import { Modal } from './ui'
import { AvatarPortrait } from './scenes'

const HOW_TO_PLAY: { title: string; detail: string }[] = [
  { title: 'Live your day', detail: 'Every action costs in-game time. Lectures, shifts and sleep all move the clock.' },
  { title: 'Watch your needs', detail: 'Hunger, energy, hygiene, happiness, social and academics all shift as time passes.' },
  { title: 'Tap the scene', detail: 'Objects and students in each scene are clickable — or use the activity list beside it.' },
  { title: 'Travel by map', detail: 'Open the campus map and pick a location. You never have to walk anywhere manually.' },
  { title: 'Handle events', detail: 'Campus events pop up with choices. Every option changes your money, needs or relationships.' },
  { title: 'Roll with it', detail: 'NEPO starts with ₦500,000 and a premium room. LAPO starts with ₦50,000 and a hustle.' },
]

export function MainMenu() {
  const save = useGame((state) => state.save)
  const setScreen = useGame((state) => state.setScreen)
  const continueGame = useGame((state) => state.continueGame)
  const resetSave = useGame((state) => state.resetSave)
  const [dialog, setDialog] = useState<'none' | 'settings' | 'howto' | 'newgame'>('none')

  const hasSave = Boolean(save)
  const completedMissions = save
    ? Object.values(save.missions).filter((entry) => entry.status === 'completed').length
    : 0
  const info = save ? LIFESTYLE_INFO[save.lifestyle] : null
  const weakNeeds = save ? lowestNeeds(save.needs, 2) : []

  return (
    <div className="absolute inset-0 z-20 flex flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950/95" />

      {save && (
        <div className="pointer-events-none absolute right-4 top-4 hidden animate-fade-up sm:block">
          <AvatarPortrait
            look={{
              gender: save.gender,
              skinTone: save.profile.skinTone,
              hairStyle: save.profile.hairStyle,
              hairColor: save.profile.hairColor,
              outfitPrimary: info?.accent ?? '#f8fafc',
              outfitSecondary: '#1e293b',
            }}
            size={96}
            ring={`${info?.accent ?? '#7c3aed'}66`}
          />
        </div>
      )}

      <div className="relative flex flex-1 flex-col items-center justify-center px-4 py-10">
        <div className="animate-fade-up text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-violet-300">
            A Nigerian university life simulator
          </p>
          <h1 className="mt-2 text-5xl font-black tracking-tight text-white drop-shadow-[0_6px_24px_rgba(124,58,237,0.55)] sm:text-7xl">
            BABCOCK <span className="text-violet-400">LIFE</span>
          </h1>
          <p className="mt-3 text-base font-semibold italic text-slate-200 sm:text-lg">
            Your campus. Your story. No walking required.
          </p>
        </div>

        <div className="mt-8 flex w-full max-w-md flex-col gap-3">
          <button
            type="button"
            className="btn-primary w-full !py-3.5 !text-base"
            onClick={() => {
              unlockAudio()
              playSfx('click')
              if (hasSave) continueGame()
              else setScreen('character')
            }}
          >
            <Play size={18} /> {hasSave ? 'Continue Game' : 'Start New Life'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              className="btn-ghost !py-3"
              onClick={() => {
                playSfx('click')
                if (hasSave) setDialog('newgame')
                else setScreen('character')
              }}
            >
              <Sparkles size={16} /> New Game
            </button>
            <button
              type="button"
              className="btn-ghost !py-3"
              onClick={() => {
                playSfx('click')
                setScreen('character')
              }}
            >
              <UserRound size={16} /> Character
            </button>
            <button
              type="button"
              className="btn-ghost !py-3"
              onClick={() => {
                playSfx('click')
                setDialog('howto')
              }}
            >
              <BookOpen size={16} /> How to play
            </button>
            <button
              type="button"
              className="btn-ghost !py-3"
              onClick={() => {
                playSfx('click')
                setDialog('settings')
              }}
            >
              <SettingsIcon size={16} /> Settings
            </button>
          </div>

          {hasSave ? (
            <button
              type="button"
              className="btn-ghost !py-2.5 !text-xs"
              onClick={() => {
                playSfx('click')
                setDialog('newgame')
              }}
            >
              <RotateCcw size={14} /> Reset save
            </button>
          ) : (
            <p className="text-center text-[11px] text-slate-400">
              No save found. Create a student — your lifestyle (NEPO or LAPO) is rolled once and
              stored forever.
            </p>
          )}
        </div>

        {save && info && (
          <div className="panel mt-6 w-full max-w-md animate-fade-up p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-white">{save.profile.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-black tracking-widest"
                    style={{
                      background: `${info.accent}22`,
                      color: info.accent,
                      border: `1px solid ${info.accent}55`,
                    }}
                  >
                    {save.lifestyle}
                  </span>
                </div>
                <p className="truncate text-[11px] text-slate-300">
                  {save.hostelName} · {save.gender === 'boy' ? 'Male wing' : 'Female wing'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-amber-300">{formatMoney(save.balance)}</div>
                <div className="text-[11px] text-slate-400">
                  {completedMissions}/{MISSIONS.length} missions
                </div>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-300">
              Day {save.clock.day} ({weekdayName(save.clock.day)}) · {formatClock(save.clock.hour)} ·{' '}
              {LOCATIONS[save.locationId].short}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">
              Places visited: {save.stats.locationsVisited.length}/{Object.keys(LOCATIONS).length} ·
              Students met: {save.stats.npcsTalked.length} · Lectures:{' '}
              {save.stats.lecturesAttended} · Shifts worked: {save.stats.jobsDone}
            </p>
            {weakNeeds.length > 0 && (
              <p className="mt-2 rounded-xl bg-amber-400/10 px-3 py-2 text-[11px] font-semibold text-amber-200">
                Watch out: {weakNeeds.map((need) => NEED_META[need].label).join(' and ')} {weakNeeds.length > 1 ? 'are' : 'is'} low.
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="relative px-4 pb-4 text-center text-[11px] text-slate-400">
        <p>Fan-made, fictionalised campus. Not affiliated with or endorsed by Babcock University.</p>
        <p className="mt-1">All students are fictional. In-game currency has no real-world value.</p>
      </footer>

      {dialog === 'settings' && <SettingsPanel onClose={() => setDialog('none')} />}

      {dialog === 'howto' && (
        <Modal
          title="How to play"
          subtitle="Manage a student life, not a walk simulator"
          icon={<BookOpen size={20} />}
          onClose={() => setDialog('none')}
        >
          <div className="grid gap-2">
            {HOW_TO_PLAY.map((entry) => (
              <div
                key={entry.title}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="text-sm font-semibold text-white">{entry.title}</div>
                <div className="text-[11px] text-slate-300">{entry.detail}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {dialog === 'newgame' && (
        <Modal
          title={hasSave ? 'Start a new game?' : 'Start playing'}
          subtitle="This creates a fresh character"
          icon={<Sparkles size={20} />}
          onClose={() => setDialog('none')}
          size="sm"
        >
          <p className="text-sm text-slate-200">
            A new game rolls a brand new lifestyle — NEPO or LAPO — with the matching allowance and
            hostel room. Your current character, money, needs, relationships, inventory and missions
            will be replaced.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                playSfx('click')
                resetSave()
                setDialog('none')
                setScreen('character')
              }}
            >
              Roll a new lifestyle
            </button>
            <button type="button" className="btn-ghost" onClick={() => setDialog('none')}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
