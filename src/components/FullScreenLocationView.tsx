import { useGame } from '../game/GameState'
import { phaseOf } from '../game/timeState'
import { SceneForLocation } from './scenes'

export function FullScreenLocationView() {
  const save = useGame((state) => state.save)
  const doActivity = useGame((state) => state.doActivity)
  const openNpc = useGame((state) => state.openNpc)
  const setPanel = useGame((state) => state.setPanel)

  if (!save) return null

  return (
    <div className="h-full min-h-0 w-full">
      <SceneForLocation
        save={save}
        phase={phaseOf(save.clock.hour)}
        onActivity={doActivity}
        onNpc={openNpc}
        onTravel={() => setPanel('map')}
      />
    </div>
  )
}