import { GraduationCap, Home, Sparkles, UserRound } from 'lucide-react'
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../game/appearance'
import { getItem } from '../game/EconomySystem'
import { useGame } from '../game/GameState'
import type { PlayerProfile } from '../types'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { MISSION_BY_ID } from '../game/MissionSystem'
import { NeedsStrip } from './NeedsStrip'
import { EmptyState, LifestyleBadge, Modal } from './ui'

export function CharacterPanel() {
  const save = useGame((state) => state.save)
  const equipOutfit = useGame((state) => state.equipOutfit)
  const updateProfile = useGame((state) => state.updateProfile)
  const setPanel = useGame((state) => state.setPanel)

  if (!save) return null

  const applyAppearance = (patch: Partial<PlayerProfile>) => {
    updateProfile({ ...save.profile, ...patch })
  }

  const info = LIFESTYLE_INFO[save.lifestyle]
  const completed = Object.entries(save.missions).filter(([, value]) => value.status === 'completed')
  const ownedOutfits = Array.from(
    new Set(save.inventory.filter((id) => getItem(id)?.category === 'outfit')),
  )
  const outfit = getItem(save.equipment.outfitId)

  return (
    <Modal
      title="Student Profile"
      subtitle={`${save.gender === 'boy' ? 'Male' : 'Female'} student · day ${save.clock.day} on campus`}
      icon={<UserRound size={20} />}
      onClose={() => setPanel(null)}
      size="lg"
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-black"
              style={{
                background: `${info.accent}22`,
                color: info.accent,
                border: `1px solid ${info.accent}55`,
              }}
            >
              {save.profile.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <div className="text-lg font-bold text-white">{save.profile.name}</div>
              <div className="flex items-center gap-2">
                <LifestyleBadge lifestyle={save.lifestyle} small />
                <span className="text-[11px] text-slate-400">{info.tagline}</span>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">{info.blurb}</p>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-3">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-violet-300">
              Current needs
            </h3>
            <NeedsStrip needs={save.needs} />
          </div>

          <dl className="mt-4 grid gap-2 text-xs">
            <div className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="flex items-center gap-1.5 text-slate-400">
                <Home size={12} /> Residence
              </dt>
              <dd className="font-semibold text-slate-100">{save.hostelName}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="text-slate-400">Allowance</dt>
              <dd className="font-bold text-amber-300">{formatMoney(save.balance)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="text-slate-400">Energy</dt>
              <dd className="font-semibold text-emerald-300">{Math.round(save.needs.energy)}/100</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="text-slate-400">Skin tone</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-slate-100">
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20"
                  style={{ background: save.profile.skinTone }}
                />
                {save.profile.skinTone}
              </dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-black/25 px-2.5 py-1.5">
              <dt className="text-slate-400">Hair</dt>
              <dd className="flex items-center gap-1.5 font-semibold text-slate-100">
                <span
                  className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20"
                  style={{ background: save.profile.hairColor }}
                />
                style {save.profile.hairStyle + 1}
              </dd>
            </div>
          </dl>
        </div>

        <div className="grid gap-4">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-violet-300">
              Wearing
            </h3>
            {outfit ? (
              <div className="mt-2 flex items-center gap-3">
                <span className="flex gap-1">
                  <span
                    className="h-6 w-6 rounded-md ring-1 ring-white/20"
                    style={{ background: outfit.primary }}
                  />
                  <span
                    className="h-6 w-6 rounded-md ring-1 ring-white/20"
                    style={{ background: outfit.secondary }}
                  />
                </span>
                <div>
                  <div className="text-sm font-semibold text-white">{outfit.name}</div>
                  <div className="text-[11px] text-slate-400">{outfit.blurb}</div>
                </div>
              </div>
            ) : (
              <EmptyState>No outfit equipped.</EmptyState>
            )}

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {ownedOutfits.map((id) => {
                const item = getItem(id)
                if (!item) return null
                const equipped = save.equipment.outfitId === id
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={equipped}
                    onClick={() => equipOutfit(id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                      equipped
                        ? 'border-violet-400/60 bg-violet-500/15 text-white'
                        : 'border-white/10 bg-white/5 text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded ring-1 ring-white/20"
                      style={{ background: item.primary }}
                    />
                    {item.name}
                    {equipped && <span className="ml-auto text-[10px] text-violet-200">worn</span>}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Buy more outfits at the Campus Mart — they change your character immediately.
            </p>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              <Sparkles size={14} /> Appearance
            </h3>
            <p className="mt-1 text-[11px] text-slate-400">
              Same as using the mirror in your room. Free and instant.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  title={tone.label}
                  onClick={() => applyAppearance({ skinTone: tone.color })}
                  className={`h-8 w-8 rounded-full ring-2 transition ${
                    save.profile.skinTone === tone.color ? 'ring-violet-400' : 'ring-white/20 hover:ring-white/50'
                  }`}
                  style={{ background: tone.color }}
                />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => applyAppearance({ hairStyle: style.id })}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${
                    save.profile.hairStyle === style.id
                      ? 'border-violet-400/70 bg-violet-500/20 text-white'
                      : 'border-white/10 bg-black/25 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {HAIR_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => applyAppearance({ hairColor: color })}
                  className={`h-6 w-6 rounded-full ring-2 transition ${
                    save.profile.hairColor === color ? 'ring-violet-400' : 'ring-white/20 hover:ring-white/50'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              <GraduationCap size={14} /> Progress
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <Stat label="Missions done" value={`${completed.length}/${Object.keys(MISSION_BY_ID).length}`} />
              <Stat label="Locations visited" value={`${save.stats.locationsVisited.length}`} />
              <Stat label="Students met" value={`${save.stats.npcsTalked.length}`} />
              <Stat label="Lectures attended" value={`${save.stats.lecturesAttended}`} />
              <Stat label="Meals bought" value={`${save.stats.mealsBought}`} />
              <Stat label="Furniture bought" value={`${save.stats.furniturePurchased}`} />
            </div>
          </section>
        </div>
      </div>
    </Modal>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-black/25 px-2.5 py-1.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  )
}
