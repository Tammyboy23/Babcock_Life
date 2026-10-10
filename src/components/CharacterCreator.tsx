import { useMemo, useState } from 'react'
import { ArrowLeft, Check, Lock, Sparkles, Users } from 'lucide-react'
import type { Gender, PlayerProfile } from '../types'
import { SHOP_BY_ID, SHOP_ITEMS } from '../game/EconomySystem'
import { playSfx } from '../game/audio'
import { useGame } from '../game/GameState'
import { HAIR_COLORS, HAIR_STYLES, SKIN_TONES } from '../game/appearance'
import { AvatarBody, AvatarPortrait, type AvatarLook } from './scenes'

const OUTFIT_OPTIONS = SHOP_ITEMS.filter((item) => item.category === 'outfit')

interface CharacterCreatorProps {
  onBack: () => void
}

export function CharacterCreator({ onBack }: CharacterCreatorProps) {
  const save = useGame((state) => state.save)
  const newGame = useGame((state) => state.newGame)
  const updateProfile = useGame((state) => state.updateProfile)
  const setScreen = useGame((state) => state.setScreen)
  const editing = Boolean(save)

  const [name, setName] = useState(save?.profile.name ?? '')
  const [gender, setGender] = useState<Gender>(save?.profile.gender ?? 'boy')
  const [skinTone, setSkinTone] = useState(save?.profile.skinTone ?? SKIN_TONES[3].color)
  const [hairStyle, setHairStyle] = useState(save?.profile.hairStyle ?? 0)
  const [hairColor, setHairColor] = useState(save?.profile.hairColor ?? HAIR_COLORS[0])
  const [outfitId, setOutfitId] = useState(save?.equipment.outfitId ?? 'outfit-tee')
  const [nameError, setNameError] = useState<string | null>(null)

  const ownedOutfits = useMemo(() => new Set(save?.inventory ?? ['outfit-tee']), [save])

  const equipped = SHOP_BY_ID[outfitId]
  const look: AvatarLook = {
    gender,
    skinTone,
    hairStyle,
    hairColor,
    outfitPrimary: equipped?.primary ?? '#f8fafc',
    outfitSecondary: equipped?.secondary ?? '#2f5d9e',
  }

  const confirm = () => {
    const trimmed = name.trim().slice(0, 14)
    if (trimmed.length < 2) {
      setNameError('Enter at least 2 characters for your name.')
      playSfx('error')
      return
    }
    setNameError(null)
    const profile: PlayerProfile = {
      name: trimmed,
      gender,
      skinTone,
      hairStyle,
      hairColor,
      outfitId: ownedOutfits.has(outfitId) ? outfitId : (save?.equipment.outfitId ?? 'outfit-tee'),
    }
    playSfx('click')
    if (editing) {
      updateProfile(profile)
      setScreen('menu')
    } else {
      newGame(profile)
    }
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950">
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
        <button type="button" className="btn-ghost !py-1.5 !text-xs" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black tracking-widest text-white sm:text-xl">
            {editing ? 'EDIT CHARACTER' : 'CREATE YOUR STUDENT'}
          </h1>
          <p className="text-[11px] text-slate-400">
            {editing
              ? 'Appearance changes are saved immediately'
              : 'Your lifestyle and allowance are rolled once when you confirm'}
          </p>
        </div>
        <button type="button" className="btn-primary !py-1.5 !text-xs" onClick={confirm}>
          <Check size={14} /> {editing ? 'Save' : 'Confirm'}
        </button>
      </header>

      <div className="scroll-thin flex flex-1 flex-col gap-4 overflow-y-auto p-4 sm:px-6 lg:flex-row">
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-sky-900/40 to-emerald-900/30">
          <svg viewBox="0 0 260 360" className="h-full max-h-[420px] w-full">
            <circle cx="130" cy="320" r="70" fill="rgba(15,23,42,0.35)" />
            <g transform="translate(40 40) scale(1.8)">
              <AvatarBody look={look} />
            </g>
          </svg>
          <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-slate-950/70 px-3 py-1 text-[10px] font-semibold text-slate-200">
            {name.trim() || 'Your student'} · {gender === 'boy' ? 'Emerald Hall' : 'Sapphire Hall'}
          </div>
        </div>

        <div className="grid w-full gap-4 lg:w-[26rem]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <AvatarPortrait look={look} size={56} />
              <label className="flex-1 text-xs font-bold uppercase tracking-wider text-violet-300" htmlFor="student-name">
                Student name
                <input
                  id="student-name"
                  value={name}
                  maxLength={14}
                  placeholder="e.g. Tolu"
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError(null)
                  }}
                  className="mt-2 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm font-normal normal-case tracking-normal text-white outline-none transition focus:border-violet-400"
                />
              </label>
            </div>
            {nameError && <p className="mt-1 text-[11px] text-rose-300">{nameError}</p>}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
              <Users size={14} /> Gender & residence wing
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['boy', 'girl'] as Gender[]).map((entry) => (
                <button
                  key={entry}
                  type="button"
                  onClick={() => {
                    setGender(entry)
                    playSfx('click')
                  }}
                  className={`rounded-xl border px-3 py-3 text-sm font-bold capitalize transition ${
                    gender === entry
                      ? 'border-violet-400/70 bg-violet-500/20 text-white'
                      : 'border-white/10 bg-black/25 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {entry}
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                    {entry === 'boy' ? 'Emerald Hall' : 'Sapphire Hall'}
                  </span>
                </button>
              ))}
            </div>
            {editing && (
              <p className="mt-2 text-[11px] text-amber-200">
                Changing gender moves you into the other residence wing.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">Skin tone</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {SKIN_TONES.map((tone) => (
                <button
                  key={tone.id}
                  type="button"
                  title={tone.label}
                  onClick={() => {
                    setSkinTone(tone.color)
                    playSfx('click')
                  }}
                  className={`h-9 w-9 rounded-full ring-2 transition ${
                    skinTone === tone.color ? 'ring-violet-400' : 'ring-white/20 hover:ring-white/50'
                  }`}
                  style={{ background: tone.color }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">Hairstyle</h2>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => {
                    setHairStyle(style.id)
                    playSfx('click')
                  }}
                  className={`rounded-lg border px-2 py-2 text-[11px] font-semibold transition ${
                    hairStyle === style.id
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
                  onClick={() => {
                    setHairColor(color)
                    playSfx('click')
                  }}
                  className={`h-7 w-7 rounded-full ring-2 transition ${
                    hairColor === color ? 'ring-violet-400' : 'ring-white/20 hover:ring-white/50'
                  }`}
                  style={{ background: color }}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-violet-300">Outfit</h2>
            <div className="mt-2 grid gap-2">
              {OUTFIT_OPTIONS.map((item) => {
                const owned = ownedOutfits.has(item.id)
                const selected = outfitId === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!owned}
                    onClick={() => {
                      setOutfitId(item.id)
                      playSfx('click')
                    }}
                    className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      selected
                        ? 'border-violet-400/70 bg-violet-500/20'
                        : owned
                          ? 'border-white/10 bg-black/25 hover:bg-white/10'
                          : 'cursor-not-allowed border-white/5 bg-black/40 opacity-60'
                    }`}
                  >
                    <span className="flex gap-1">
                      <span className="h-5 w-5 rounded-md ring-1 ring-white/20" style={{ background: item.primary }} />
                      <span className="h-5 w-5 rounded-md ring-1 ring-white/20" style={{ background: item.secondary }} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-white">{item.name}</span>
                      <span className="block text-[10px] text-slate-400">
                        {owned ? 'Owned' : 'Locked · buy at Campus Mart'}
                      </span>
                    </span>
                    {!owned && <Lock size={14} className="text-slate-400" />}
                  </button>
                )
              })}
            </div>
            {!editing && (
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-violet-200">
                <Sparkles size={12} className="mt-0.5 shrink-0" />
                <span>You start with the Campus Tee. Buy more outfits in-game and wear them instantly.</span>
              </p>
            )}
          </section>
        </div>
      </div>

      <footer className="border-t border-white/10 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">
            Audio and interface options live in Settings once you are on campus.
          </p>
          <button type="button" className="btn-primary" onClick={confirm}>
            <Check size={16} /> {editing ? 'Save appearance' : 'Confirm & continue'}
          </button>
        </div>
      </footer>
    </div>
  )
}
