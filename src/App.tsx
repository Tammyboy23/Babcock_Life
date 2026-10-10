import { useEffect } from 'react'
import { CampusMapPanel } from './components/CampusMapPanel'
import { CharacterCreator } from './components/CharacterCreator'
import { CharacterPanel } from './components/CharacterPanel'
import { DialoguePanel } from './components/DialoguePanel'
import { EventModal } from './components/EventModal'
import { FullScreenLocationView } from './components/FullScreenLocationView'
import { GameHUD } from './components/GameHUD'
import { InventoryPanel } from './components/InventoryPanel'
import { LifestyleReveal } from './components/LifestyleReveal'
import { MainMenu } from './components/MainMenu'
import { MissionPanel } from './components/MissionPanel'
import { GameErrorBoundary, LoadingOverlay, useBootDelay } from './components/Overlays'
import { PauseMenu } from './components/PauseMenu'
import { RelationshipsPanel } from './components/RelationshipsPanel'
import { SchedulePanel } from './components/SchedulePanel'
import { SettingsPanel } from './components/SettingsPanel'
import { ShopPanel } from './components/ShopPanel'
import { Toasts } from './components/Toasts'
import { useGame } from './game/GameState'
import { unlockAudio } from './game/audio'

export default function App() {
  const screen = useGame((state) => state.screen)
  const panel = useGame((state) => state.panel)
  const boot = useGame((state) => state.boot)
  const setScreen = useGame((state) => state.setScreen)
  const bootDelayDone = useBootDelay(450)

  useEffect(() => {
    boot()
  }, [boot])

  useEffect(() => {
    const onFirstGesture = () => {
      unlockAudio()
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
    }
    window.addEventListener('pointerdown', onFirstGesture)
    window.addEventListener('keydown', onFirstGesture)
    return () => {
      window.removeEventListener('pointerdown', onFirstGesture)
      window.removeEventListener('keydown', onFirstGesture)
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Escape') return
      const state = useGame.getState()
      if (state.screen !== 'game') return
      if (event.target instanceof HTMLElement && event.target.tagName === 'INPUT') return
      event.preventDefault()
      state.togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(circle at 20% 10%, rgba(124,58,237,0.25), transparent 55%), radial-gradient(circle at 80% 90%, rgba(14,165,233,0.2), transparent 50%)',
        }}
      />

      <GameErrorBoundary>
        {screen === 'menu' && <MainMenu />}

        {screen === 'character' && <CharacterCreator onBack={() => setScreen('menu')} />}

        {screen === 'reveal' && <LifestyleReveal />}

        {screen === 'game' && (
          <div className="absolute inset-0 z-10 flex flex-col">
            <GameHUD />
            <div className="relative min-h-0 flex-1 overflow-hidden">
              <FullScreenLocationView />
            </div>
            <Toasts />
            <DialoguePanel />
            {panel === 'missions' && <MissionPanel />}
            {panel === 'inventory' && <InventoryPanel />}
            {panel === 'shop' && <ShopPanel />}
            {panel === 'character' && <CharacterPanel />}
            {panel === 'settings' && <SettingsPanel />}
            {panel === 'map' && <CampusMapPanel />}
            {panel === 'relationships' && <RelationshipsPanel />}
            {panel === 'schedule' && <SchedulePanel />}
            <EventModal />
            <PauseMenu />
          </div>
        )}
      </GameErrorBoundary>

      <LoadingOverlay visible={!bootDelayDone} />
    </div>
  )
}
