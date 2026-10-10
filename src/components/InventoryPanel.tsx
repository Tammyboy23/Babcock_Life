import { Backpack, Shirt, Sofa, Utensils } from 'lucide-react'
import { getItem, ownedFurnitureList, STARTER_OUTFIT } from '../game/EconomySystem'
import { useGame } from '../game/GameState'
import { formatMoney } from '../game/constants'
import { EmptyState, Modal } from './ui'

export function InventoryPanel() {
  const save = useGame((state) => state.save)
  const equipOutfit = useGame((state) => state.equipOutfit)
  const consumeItem = useGame((state) => state.consumeItem)
  const setPanel = useGame((state) => state.setPanel)

  if (!save) return null

  const outfitIds = Array.from(new Set(save.inventory.filter((id) => getItem(id)?.category === 'outfit')))
  if (!outfitIds.includes(STARTER_OUTFIT) && !outfitIds.includes(save.equipment.outfitId)) {
    outfitIds.unshift(save.equipment.outfitId)
  }
  const consumableCounts = new Map<string, number>()
  for (const id of save.inventory) {
    const item = getItem(id)
    if (item?.category === 'consumable') {
      consumableCounts.set(id, (consumableCounts.get(id) ?? 0) + 1)
    }
  }
  const giftCounts = new Map<string, number>()
  for (const id of save.inventory) {
    if (getItem(id)?.category === 'gift') {
      giftCounts.set(id, (giftCounts.get(id) ?? 0) + 1)
    }
  }
  const furniture = ownedFurnitureList(save.equipment.furniture)

  return (
    <Modal
      title="Inventory"
      subtitle={`Balance ${formatMoney(save.balance)}`}
      icon={<Backpack size={20} />}
      onClose={() => setPanel(null)}
    >
      <section className="mb-5">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <Shirt size={14} /> Outfits
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {outfitIds.map((id) => {
            const item = getItem(id)
            if (!item) return null
            const equipped = save.equipment.outfitId === id
            return (
              <div
                key={id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  equipped ? 'border-violet-400/60 bg-violet-500/10' : 'border-white/10 bg-white/5'
                }`}
              >
                <span className="flex gap-1">
                  <span
                    className="h-5 w-5 rounded-md ring-1 ring-white/20"
                    style={{ background: item.primary }}
                  />
                  <span
                    className="h-5 w-5 rounded-md ring-1 ring-white/20"
                    style={{ background: item.secondary }}
                  />
                </span>
                <span className="min-w-0 flex-1 text-sm font-semibold text-white">{item.name}</span>
                <button
                  type="button"
                  className={equipped ? 'btn-ghost !py-1 !text-[11px]' : 'btn-primary !py-1 !text-[11px]'}
                  disabled={equipped}
                  onClick={() => equipOutfit(id)}
                >
                  {equipped ? 'Wearing' : 'Wear'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      <section className="mb-5">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <Utensils size={14} /> Snacks
        </h3>
        {consumableCounts.size === 0 ? (
          <EmptyState>No snacks yet. The Campus Mart and the food court both sell them.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from(consumableCounts.entries()).map(([id, count]) => {
              const item = getItem(id)
              if (!item) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                    {item.name}
                    <span className="ml-2 text-[11px] font-normal text-slate-400">x{count}</span>
                  </span>
                  <button
                    type="button"
                    className="btn-gold !py-1 !text-[11px]"
                    onClick={() => consumeItem(id)}
                    title={needsLabel(item.needs)}
                  >
                    Use
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <Sofa size={14} /> Room furniture installed
        </h3>
        {furniture.length === 0 ? (
          <EmptyState>Your room is empty. Buy furniture at the Campus Mart.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {furniture.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              >
                <div className="font-semibold">{item.name}</div>
                <div className="text-[11px] text-slate-400">
                  {item.slot} · tier {(item.tier ?? 0) + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet-300">
          <Sofa size={14} /> Gifts
        </h3>
        {giftCounts.size === 0 ? (
          <EmptyState>No gifts yet. Chocolates, airtime and flowers are sold at the Campus Mart.</EmptyState>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from(giftCounts.entries()).map(([id, count]) => {
              const item = getItem(id)
              if (!item) return null
              return (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                    {item.name}
                    <span className="ml-2 text-[11px] font-normal text-slate-400">x{count}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-violet-200">
                    +{item.giftValue ?? 10} relationship
                  </span>
                </div>
              )
            })}
          </div>
        )}
        <p className="mt-2 text-[11px] text-slate-400">
          Give a gift from a student&apos;s conversation menu while you are standing in the same location.
        </p>
      </section>
    </Modal>
  )
}

function needsLabel(needs: Partial<Record<string, number>> | undefined): string {
  if (!needs) return 'Use this item'
  return Object.entries(needs)
    .map(([key, value]) => `${key} +${value}`)
    .join(' · ')
}
