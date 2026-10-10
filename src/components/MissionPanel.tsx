import { CheckCircle2, Circle, Lock, Target } from 'lucide-react'
import { useState } from 'react'
import { formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { missionSnapshots } from '../game/MissionSystem'
import { NPC_BY_ID } from '../game/npcs'
import { Bar, EmptyState, Modal } from './ui'

type Tab = 'active' | 'available' | 'completed'

export function MissionPanel() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const [tab, setTab] = useState<Tab>('active')

  if (!save) return null

  const snapshots = missionSnapshots(save)
  const groups: Record<Tab, typeof snapshots> = {
    active: snapshots.filter((entry) => entry.progress.status === 'active'),
    available: snapshots.filter((entry) => entry.progress.status === 'available'),
    completed: snapshots.filter((entry) => entry.progress.status === 'completed'),
  }
  const list = groups[tab]

  return (
    <Modal
      title="Missions"
      subtitle={`${groups.active.length} active · ${groups.completed.length} completed`}
      icon={<Target size={20} />}
      onClose={() => setPanel(null)}
    >
      <div className="mb-4 flex gap-2">
        {(['active', 'available', 'completed'] as Tab[]).map((entry) => (
          <button
            key={entry}
            type="button"
            onClick={() => setTab(entry)}
            className={`flex-1 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
              tab === entry
                ? 'bg-violet-600 text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {entry} ({groups[entry].length})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState>
          {tab === 'active'
            ? 'No active missions. Talk to students around campus — they always need something.'
            : tab === 'available'
              ? 'No new briefs right now. Explore and talk to more students.'
              : 'Nothing completed yet. Finish a mission and it will appear here.'}
        </EmptyState>
      ) : (
        <div className="grid gap-3">
          {list.map(({ def, progress, counter }) => {
            const giver = def.giver ? NPC_BY_ID[def.giver] : null
            const done = progress.status === 'completed'
            return (
              <div
                key={def.id}
                className={`rounded-xl border px-4 py-3 ${
                  done
                    ? 'border-emerald-400/30 bg-emerald-400/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">{def.title}</h3>
                  <span className="flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                    {formatMoney(def.reward)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{def.description}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-violet-300">
                  Objective: {def.objective}
                </p>

                <ul className="mt-2 grid gap-1">
                  {def.steps.map((step, index) => {
                    const stepDone = done || counter > index
                    return (
                      <li key={step} className="flex items-center gap-2 text-xs text-slate-200">
                        {stepDone ? (
                          <CheckCircle2 size={14} className="text-emerald-400" />
                        ) : progress.status === 'available' ? (
                          <Lock size={13} className="text-slate-500" />
                        ) : (
                          <Circle size={13} className="text-slate-500" />
                        )}
                        <span className={stepDone ? 'text-slate-400 line-through' : ''}>{step}</span>
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-2.5 flex items-center gap-3">
                  <Bar
                    value={done ? def.goal : Math.min(counter, def.goal)}
                    max={def.goal}
                    from={done ? '#22c55e' : '#7c3aed'}
                    to={done ? '#86efac' : '#a78bfa'}
                  />
                  <span className="text-[11px] font-semibold text-slate-300">
                    {Math.min(counter, def.goal)}/{def.goal}
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-slate-400">
                  {done
                    ? 'Reward paid. Nice work.'
                    : progress.status === 'available'
                      ? `Talk to ${giver ? giver.name : 'a student'} to start this mission.`
                      : def.completionHint}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}
