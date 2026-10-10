import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Lifestyle } from '../types'
import { LIFESTYLE_INFO, formatMoney } from '../game/constants'
import { playSfx } from '../game/audio'

interface ModalProps {
  title: string
  subtitle?: string
  icon?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ title, subtitle, icon, onClose, children, footer, size = 'md' }: ModalProps) {
  const width = size === 'sm' ? 'max-w-md' : size === 'lg' ? 'max-w-4xl' : 'max-w-2xl'
  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center p-3 sm:p-6">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={() => {
          playSfx('click')
          onClose()
        }}
      />
      <div className={`panel relative flex max-h-full w-full ${width} animate-pop-in flex-col overflow-hidden`}>
        <header className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-200">
                {icon}
              </span>
            )}
            <div>
              <h2 className="text-lg font-bold tracking-wide text-white">{title}</h2>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={() => {
              playSfx('click')
              onClose()
            }}
          >
            <X size={18} />
          </button>
        </header>
        <div className="scroll-thin flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="border-t border-white/10 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

export function Bar({
  value,
  max,
  from,
  to,
  height = 8,
}: {
  value: number
  max: number
  from: string
  to: string
  height?: number
}) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      className="w-full overflow-hidden rounded-full bg-black/45 ring-1 ring-inset ring-white/10"
      style={{ height }}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${percent}%`, background: `linear-gradient(90deg, ${from}, ${to})` }}
      />
    </div>
  )
}

export function LifestyleBadge({ lifestyle, small }: { lifestyle: Lifestyle; small?: boolean }) {
  const info = LIFESTYLE_INFO[lifestyle]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-bold tracking-widest ${
        small ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      }`}
      style={{
        background: `${info.accent}22`,
        color: info.accent,
        border: `1px solid ${info.accent}66`,
      }}
    >
      {lifestyle}
    </span>
  )
}

export function MoneyChip({ amount, className = '' }: { amount: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-amber-300 ${className}`}>
      {formatMoney(amount)}
    </span>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-slate-400">
      {children}
    </div>
  )
}
