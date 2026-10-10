import { Heart } from 'lucide-react'
import { useGame } from '../game/GameState'
import { LOCATIONS } from '../game/locations'
import { NPCS } from '../game/npcs'
import { nextTier, relationshipScore, relationshipTier } from '../game/RelationshipSystem'
import { Modal } from './ui'
import { AvatarPortrait } from './scenes'

export function RelationshipsPanel() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const openNpc = useGame((state) => state.openNpc)
  const travelTo = useGame((state) => state.travelTo)

  if (!save) return null

  const sorted = [...NPCS].sort((a, b) => relationshipScore(save, b.id) - relationshipScore(save, a.id))
  const met = sorted.filter((npc) => relationshipScore(save, npc.id) > 0).length

  return (
    <Modal
      title="Relationships"
      subtitle={`${met} of ${NPCS.length} students know you`}
      icon={<Heart size={20} />}
      onClose={() => setPanel(null)}
      size="lg"
    >
      <div className="grid gap-2 sm:grid-cols-2">
        {sorted.map((npc) => {
          const score = relationshipScore(save, npc.id)
          const tier = relationshipTier(score)
          const upcoming = nextTier(score)
          const here = save.locationId === npc.location
          return (
            <div
              key={npc.id}
              className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-start gap-3">
                <AvatarPortrait
                  look={{
                    gender: npc.gender,
                    skinTone: npc.skinTone,
                    hairStyle: npc.hairStyle,
                    hairColor: npc.hairColor,
                    outfitPrimary: npc.outfitPrimary,
                    outfitSecondary: npc.outfitSecondary,
                  }}
                  size={52}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-bold text-white">{npc.name}</span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide"
                      style={{ background: `${tier.tone}22`, color: tier.tone }}
                    >
                      {tier.label}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-slate-400">{npc.tag}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-black/50">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                        style={{ width: `${score}%`, background: tier.tone }}
                      />
                    </span>
                    <span className="text-[10px] font-bold text-slate-300">{score}/100</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-300">{npc.personality}</p>
              <p className="text-[10px] text-slate-400">
                Interests: {npc.interests.join(' · ')}
              </p>
              <p className="text-[10px] text-slate-400">
                {score > 0 ? tier.blurb : 'You have not met them yet.'}
                {upcoming ? ` Next: ${upcoming.label} at ${upcoming.min}.` : ' Maxed out friendship.'}
              </p>

              <div className="mt-auto flex items-center justify-between gap-2">
                <span className="chip text-[10px]">{LOCATIONS[npc.location].short}</span>
                {here ? (
                  <button
                    type="button"
                    className="btn-primary !py-1.5 !text-[11px]"
                    onClick={() => openNpc(npc.id)}
                  >
                    Talk now
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-ghost !py-1.5 !text-[11px]"
                    onClick={() => {
                      travelTo(npc.location)
                      setPanel(null)
                    }}
                  >
                    Travel there
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
