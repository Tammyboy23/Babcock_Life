import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, BedDouble, Coins, Dices, Home } from 'lucide-react'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { useGame } from '../game/GameState'
import { playSfx } from '../game/audio'

export function LifestyleReveal() {
  const save = useGame((state) => state.save)
  const reveal = useGame((state) => state.reveal)
  const finishReveal = useGame((state) => state.finishReveal)
  const [shown, setShown] = useState(0)
  const [stage, setStage] = useState(0)

  const lifestyle = reveal?.lifestyle ?? save?.lifestyle ?? 'LAPO'
  const allowance = reveal?.allowance ?? save?.balance ?? 0
  const info = LIFESTYLE_INFO[lifestyle]

  useEffect(() => {
    playSfx('reveal')
    const stageTimer = window.setTimeout(() => setStage(1), 260)
    return () => window.clearTimeout(stageTimer)
  }, [])

  useEffect(() => {
    const duration = 1300
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setShown(Math.round(allowance * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [allowance])

  const points = useMemo(() => {
    if (lifestyle === 'NEPO') {
      return [
        'Starting allowance of ₦500,000',
        'Premium hostel room: double bed, executive desk, rug, AC and mini fridge',
        'Room furnishing and premium outfits are affordable from day one',
      ]
    }
    return [
      'Starting allowance of ₦50,000',
      'Modest hostel room: bunk mattress, small study desk and a plastic chair',
      'Earn more through missions, part-time shifts and campus event work',
    ]
  }, [lifestyle])

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center overflow-hidden px-4"
      style={{
        background: `radial-gradient(circle at 50% 35%, ${info.accent}22, rgba(2,6,23,0.94) 62%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div
          className="absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full animate-pulse"
          style={{ background: `radial-gradient(circle, ${info.accent}22, transparent 65%)` }}
        />
      </div>

      <div className="relative w-full max-w-xl text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.45em] text-slate-300">
          Lifestyle assignment complete
        </p>

        <div
          className={`mt-4 transition-all duration-700 ${
            stage === 1 ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}
        >
          <div
            className="text-5xl font-black tracking-tight sm:text-7xl"
            style={{ color: info.accent, textShadow: `0 0 40px ${info.accent}66` }}
          >
            YOU&apos;RE {info.title}!
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-200">
            {info.tagline} · {save?.gender === 'girl' ? 'Female' : 'Male'} wing ·{' '}
            {save?.hostelName ?? 'Hostel'}
          </p>
        </div>

        <div className="panel mt-6 animate-fade-up p-5">
          <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-300">
            <Coins size={14} /> Starting allowance
          </div>
          <div className="mt-1 text-4xl font-black text-amber-300 sm:text-5xl">
            {formatMoney(shown)}
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{info.blurb}</p>

          <ul className="mt-4 grid gap-2 text-left">
            {points.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
              >
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: info.accent }}
                />
                {point}
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-2 text-left text-[11px] text-slate-300">
            <span className="flex items-center gap-2">
              <Home size={12} className="text-violet-300" />
              Assigned residence: {save?.hostelName ?? 'Hostel'}
            </span>
            <span className="flex items-center gap-2">
              <BedDouble size={12} className="text-violet-300" />
              {lifestyle === 'NEPO'
                ? 'Your room is already furnished to premium standard — and upgraded pieces are still available.'
                : 'Your room starts bare — buy upgrades and it visibly improves.'}
            </span>
            <span className="flex items-center gap-2">
              <Dices size={12} className="text-violet-300" />
              Rolled once at random (50/50) and saved permanently. It will not change on refresh.
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="btn-primary !px-6 !py-3 !text-base"
            onClick={() => {
              playSfx('click')
              finishReveal()
            }}
          >
            Move into my room <ArrowRight size={18} />
          </button>
          <p className="text-[11px] text-slate-400">
            You start inside your room with a full activity menu — sleep, shower, study, decorate and
            travel anywhere on campus from the map.
          </p>
        </div>
      </div>
    </div>
  )
}
