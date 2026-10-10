import { Target, X } from 'lucide-react'
import { useEffect } from 'react'
import { formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { MISSION_BY_ID } from '../game/MissionSystem'
import { NPC_BY_ID } from '../game/npcs'
import { interactionOffers, relationshipScore, relationshipTier } from '../game/RelationshipSystem'
import { formatDuration } from '../game/timeState'
import { AvatarPortrait, SceneIcon } from './scenes'

export function DialoguePanel() {
  const dialogue = useGame((state) => state.dialogue)
  const save = useGame((state) => state.save)
  const closeNpc = useGame((state) => state.closeNpc)
  const interactNpc = useGame((state) => state.interactNpc)
  const acceptMission = useGame((state) => state.acceptMission)

  useEffect(() => {
    if (!dialogue) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      event.preventDefault()
      closeNpc()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialogue, closeNpc])

  if (!dialogue || !save) return null

  const npc = NPC_BY_ID[dialogue.npcId]
  if (!npc) return null

  const score = relationshipScore(save, npc.id)
  const tier = relationshipTier(score)
  const offers = interactionOffers(npc, save)
  const mission = npc.missionId ? MISSION_BY_ID[npc.missionId] : undefined
  const missionProgress = mission ? save.missions[mission.id] : undefined

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center p-2 sm:p-4">
      <div className="panel pointer-events-auto w-full max-w-3xl animate-fade-up overflow-hidden">
        <header className="flex items-start gap-3 px-4 pt-4">
          <AvatarPortrait
            look={{
              gender: npc.gender,
              skinTone: npc.skinTone,
              hairStyle: npc.hairStyle,
              hairColor: npc.hairColor,
              outfitPrimary: npc.outfitPrimary,
              outfitSecondary: npc.outfitSecondary,
            }}
            size={50}
            ring={`${tier.tone}66`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-bold text-white">{npc.name}</span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
                {npc.tag}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide"
                style={{ background: `${tier.tone}22`, color: tier.tone }}
              >
                {tier.label} · {score}/100
              </span>
            </div>
            <p className="mt-1 text-[11px] font-semibold text-violet-200">{dialogue.headline}</p>
            <div className="mt-1.5 grid gap-1">
              {dialogue.lines.map((line) => (
                <p key={line} className="text-sm leading-relaxed text-slate-100">
                  “{line}”
                </p>
              ))}
              {dialogue.lines.length === 0 && (
                <p className="text-sm text-slate-300">They acknowledge you with a nod.</p>
              )}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={() => closeNpc()}
            aria-label="Close conversation"
          >
            <X size={18} />
          </button>
        </header>

        {mission && (
          <div className="mx-4 mt-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-3 py-2">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-amber-200">
              <Target size={13} /> {mission.title}
            </div>
            <p className="mt-1 text-[11px] text-amber-50">{mission.description}</p>
            <p className="mt-1 text-[11px] text-amber-100/80">
              Objective: {mission.objective} · Reward {formatMoney(mission.reward)}
            </p>
            {missionProgress?.status === 'available' ? (
              <button
                type="button"
                className="btn-primary mt-2 !py-1.5 !text-[11px]"
                onClick={() => acceptMission(mission.id)}
              >
                Accept this mission
              </button>
            ) : (
              <p className="mt-1 text-[11px] font-semibold text-emerald-200">
                {missionProgress?.status === 'completed'
                  ? 'Completed. Reward already paid.'
                  : `Tracked · ${Math.min(missionProgress?.counter ?? 0, mission.goal)}/${mission.goal}`}
              </p>
            )}
          </div>
        )}

        <div className="mt-3 grid gap-2 border-t border-white/10 bg-black/20 px-4 py-3 sm:grid-cols-2">
          {offers.map((offer) => (
            <button
              key={offer.id}
              type="button"
              disabled={Boolean(offer.disabledReason)}
              onClick={() => interactNpc(npc.id, offer.id)}
              className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                offer.disabledReason
                  ? 'cursor-not-allowed border-white/5 bg-black/30 opacity-60'
                  : 'border-white/10 bg-white/5 hover:border-violet-400/60 hover:bg-violet-500/10'
              }`}
            >
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{offer.label}</span>
                <span className="block text-[11px] text-slate-400">
                  {offer.disabledReason ?? offer.blurb}
                </span>
              </span>
              <span className="shrink-0 text-right text-[10px] font-semibold text-slate-300">
                <span className="block">{formatDuration(offer.minutes)}</span>
                {offer.cost ? (
                  <span className="block text-amber-200">{formatMoney(offer.cost)}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <SceneIcon name="users" size={12} /> Interests: {npc.interests.join(' · ')}
          </span>
          <button
            type="button"
            className="btn-ghost !py-1 !text-[11px]"
            onClick={() => closeNpc()}
          >
            End conversation
          </button>
        </footer>
      </div>
    </div>
  )
}
