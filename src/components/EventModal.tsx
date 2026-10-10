import { ArrowRight } from 'lucide-react'
import { formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { SceneIcon } from './scenes'

export function EventModal() {
  const save = useGame((state) => state.save)
  const activeEvent = useGame((state) => state.activeEvent)
  const eventResult = useGame((state) => state.eventResult)
  const resolveEvent = useGame((state) => state.resolveEvent)
  const dismissEventResult = useGame((state) => state.dismissEventResult)

  if (!save) return null

  if (eventResult) {
    return (
      <div className="pointer-events-auto absolute inset-0 z-[45] flex items-center justify-center p-3">
        <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />
        <div className="panel relative w-full max-w-md animate-pop-in p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-violet-300">
            Result
          </p>
          <h2 className="mt-1 text-lg font-bold text-white">{eventResult.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{eventResult.text}</p>
          <button type="button" className="btn-primary mt-4 w-full" onClick={() => dismissEventResult()}>
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    )
  }

  if (!activeEvent) return null

  return (
    <div className="pointer-events-auto absolute inset-0 z-[45] flex items-center justify-center p-3">
      <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm" />
      <div className="panel relative w-full max-w-lg animate-pop-in overflow-hidden">
        <header className="flex items-start gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-100">
            <SceneIcon name={activeEvent.icon} size={20} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200">
              {activeEvent.tag} event
            </p>
            <h2 className="text-lg font-bold text-white">{activeEvent.title}</h2>
          </div>
        </header>

        <div className="px-5 py-4">
          <p className="text-sm leading-relaxed text-slate-200">{activeEvent.body}</p>
          <div className="mt-4 grid gap-2">
            {activeEvent.choices.map((choice) => {
              const blocked = Boolean(choice.requiresMoney && save.balance < choice.requiresMoney)
              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={blocked}
                  onClick={() => resolveEvent(choice.id)}
                  className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    blocked
                      ? 'cursor-not-allowed border-white/5 bg-black/30 opacity-60'
                      : 'border-white/10 bg-white/5 hover:border-violet-400/60 hover:bg-violet-500/10'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-white">{choice.label}</span>
                    {choice.hint && <span className="block text-[11px] text-slate-400">{choice.hint}</span>}
                  </span>
                  <span className="shrink-0 text-right text-[11px] font-bold">
                    {choice.effect.balance ? (
                      <span className={choice.effect.balance < 0 ? 'text-rose-300' : 'text-emerald-300'}>
                        {choice.effect.balance > 0 ? '+' : ''}
                        {formatMoney(choice.effect.balance)}
                      </span>
                    ) : blocked ? (
                      <span className="text-rose-300">Cannot afford</span>
                    ) : null}
                  </span>
                </button>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Balance {formatMoney(save.balance)} · every choice changes your money, needs or relationships.
          </p>
        </div>
      </div>
    </div>
  )
}
