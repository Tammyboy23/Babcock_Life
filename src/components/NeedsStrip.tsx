import {
  BatteryCharging,
  Droplets,
  GraduationCap,
  Smile,
  Utensils,
  Users,
} from 'lucide-react'
import type { NeedKey, Needs } from '../types'
import { NEED_KEYS, NEED_META, needsWarnings } from '../game/NeedsSystem'

const NEED_ICONS: Record<NeedKey, typeof Utensils> = {
  hunger: Utensils,
  energy: BatteryCharging,
  hygiene: Droplets,
  happiness: Smile,
  social: Users,
  academic: GraduationCap,
}

export function NeedBar({ need, value, className = '' }: { need: NeedKey; value: number; className?: string }) {
  const meta = NEED_META[need]
  const Icon = NEED_ICONS[need]
  const low = value < 25
  return (
    <div className={`flex items-center gap-2 ${className}`} title={`${meta.label}: ${meta.blurb}`}>
      <Icon size={13} className={low ? 'text-rose-300' : 'text-slate-300'} />
      <span className="w-[3.6rem] shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
        {meta.label}
      </span>
      <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-black/50 ring-1 ring-inset ring-white/10">
        <span
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            background: `linear-gradient(90deg, ${meta.from}, ${meta.to})`,
          }}
        />
      </span>
      <span className={`w-7 shrink-0 text-right text-[10px] font-bold ${low ? 'text-rose-300' : 'text-slate-200'}`}>
        {Math.round(value)}
      </span>
    </div>
  )
}

/** Compact needs grid for the HUD. */
export function NeedsStrip({ needs }: { needs: Needs }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {NEED_KEYS.map((need) => (
        <NeedBar key={need} need={need} value={needs[need]} />
      ))}
    </div>
  )
}

export function NeedsWarnings({ needs }: { needs: Needs }) {
  const warnings = needsWarnings(needs)
  if (warnings.length === 0) {
    return (
      <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[11px] text-emerald-100">
        Everything is in order. Good day to make progress.
      </p>
    )
  }
  return (
    <ul className="grid gap-1.5">
      {warnings.map((warning) => (
        <li
          key={warning}
          className="rounded-xl border border-amber-400/25 bg-amber-400/5 px-3 py-2 text-[11px] text-amber-100"
        >
          {warning}
        </li>
      ))}
    </ul>
  )
}
