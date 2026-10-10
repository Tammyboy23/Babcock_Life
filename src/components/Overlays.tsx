import { Component, useEffect, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, Loader2, RefreshCw } from 'lucide-react'

export function LoadingOverlay({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950">
      <div className="relative">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 blur-xl opacity-60" />
        <span className="absolute inset-0 flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-white" />
        </span>
      </div>
      <h1 className="mt-5 text-2xl font-black tracking-widest text-white">
        BABCOCK <span className="text-violet-400">LIFE</span>
      </h1>
      <p className="mt-1 text-xs text-slate-400">Opening the gates…</p>
      <div className="mt-5 h-1 w-52 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-[shimmer_1.4s_linear_infinite] bg-gradient-to-r from-transparent via-violet-400 to-transparent" />
      </div>
    </div>
  )
}

interface BoundaryProps {
  children: ReactNode
}

interface BoundaryState {
  error: Error | null
}

export class GameErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Babcock Life crashed:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950 p-6">
          <div className="panel max-w-md p-6 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-300">
              <AlertOctagon size={24} />
            </span>
            <h2 className="mt-3 text-lg font-bold text-white">The game could not start</h2>
            <p className="mt-2 text-xs text-slate-300">
              Something failed while rendering the game. Reloading usually fixes a stuck scene.
              Your save is stored on this device and will not be lost.
            </p>
            <pre className="scroll-thin mt-3 max-h-32 overflow-auto rounded-lg bg-black/40 p-2 text-left text-[10px] text-rose-200">
              {this.state.error.message}
            </pre>
            <button
              type="button"
              className="btn-primary mt-4"
              onClick={() => {
                this.setState({ error: null })
                window.location.reload()
              }}
            >
              <RefreshCw size={15} /> Reload the game
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/** Small hook that keeps the loading overlay visible for at least a moment on first load. */
export function useBootDelay(ms = 900): boolean {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setDone(true), ms)
    return () => window.clearTimeout(timer)
  }, [ms])
  return done
}
