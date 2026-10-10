import { AlertTriangle, Coins, Info, PartyPopper } from 'lucide-react'
import { useEffect } from 'react'
import { useGame } from '../game/GameState'
import type { ToastMessage } from '../types'

const ICONS = {
  info: Info,
  success: PartyPopper,
  reward: Coins,
  error: AlertTriangle,
} as const

const TONES: Record<ToastMessage['kind'], string> = {
  info: 'border-slate-400/30 text-slate-100',
  success: 'border-emerald-400/40 text-emerald-100',
  reward: 'border-amber-400/50 text-amber-100',
  error: 'border-rose-400/50 text-rose-100',
}

function Toast({ toast }: { toast: ToastMessage }) {
  const dismiss = useGame((state) => state.dismissToast)
  const Icon = ICONS[toast.kind]

  useEffect(() => {
    const timer = window.setTimeout(() => dismiss(toast.id), 5200)
    return () => window.clearTimeout(timer)
  }, [dismiss, toast.id])

  return (
    <button
      type="button"
      onClick={() => dismiss(toast.id)}
      className={`panel pointer-events-auto flex w-72 animate-fade-up items-start gap-3 px-3.5 py-3 text-left ring-1 ${TONES[toast.kind]}`}
    >
      <span className="mt-0.5">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{toast.title}</span>
        {toast.body && <span className="block text-[11px] text-slate-300">{toast.body}</span>}
      </span>
    </button>
  )
}

export function Toasts() {
  const toasts = useGame((state) => state.toasts)
  if (toasts.length === 0) return null
  return (
    <div className="pointer-events-none absolute right-3 top-24 z-40 flex flex-col items-end gap-2 sm:right-4 sm:top-28">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
