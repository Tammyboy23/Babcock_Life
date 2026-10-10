import { ShoppingBag, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { formatMoney } from '../game/constants'
import { getItem, SHOP_ITEMS, validatePurchase } from '../game/EconomySystem'
import { useGame } from '../game/GameState'
import type { ItemCategory } from '../types'
import { Modal, MoneyChip } from './ui'

const TABS: { id: ItemCategory; label: string }[] = [
  { id: 'outfit', label: 'Outfits' },
  { id: 'furniture', label: 'Room' },
  { id: 'consumable', label: 'Snacks' },
  { id: 'gift', label: 'Gifts' },
]

export function ShopPanel() {
  const save = useGame((state) => state.save)
  const purchase = useGame((state) => state.purchase)
  const setPanel = useGame((state) => state.setPanel)
  const [tab, setTab] = useState<ItemCategory>('outfit')

  if (!save) return null

  const items = SHOP_ITEMS.filter((item) => item.category === tab)

  return (
    <Modal
      title="Campus Mart"
      subtitle="Everything you buy changes your character or your room."
      icon={<ShoppingBag size={20} />}
      onClose={() => setPanel(null)}
      footer={
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Your balance</span>
          <MoneyChip amount={save.balance} className="text-base" />
        </div>
      }
    >
      <div className="mb-4 flex gap-2">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={`flex-1 rounded-xl px-2 py-2 text-[11px] font-bold uppercase tracking-wide transition ${
              tab === entry.id ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const owned = item.category === 'outfit' && save.inventory.includes(item.id)
          const installed =
            item.category === 'furniture' && item.slot
              ? save.equipment.furniture[item.slot] === item.id
              : false
          const validation = validatePurchase(
            save.balance,
            item.id,
            save.equipment.furniture,
            save.inventory,
          )
          const count =
            item.category === 'consumable' || item.category === 'gift'
              ? save.inventory.filter((id) => id === item.id).length
              : 0

          return (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-white/5 p-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-white">{item.name}</h3>
                  {item.price === 0 ? (
                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-200">
                      FREE
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-300">
                      {formatMoney(item.price)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-snug text-slate-300">{item.blurb}</p>
                {item.primary && (
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className="h-4 w-4 rounded-full ring-1 ring-white/20"
                      style={{ background: item.primary }}
                    />
                    <span
                      className="h-4 w-4 rounded-full ring-1 ring-white/20"
                      style={{ background: item.secondary }}
                    />
                    <span className="ml-1 text-[10px] uppercase tracking-wide text-slate-400">
                      preview on character
                    </span>
                  </div>
                )}
                {count > 0 && (
                  <p className="mt-1 text-[10px] font-semibold text-slate-400">
                    In inventory: {count}
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={owned || installed || !validation.ok}
                className={`mt-3 ${
                  owned || installed ? 'btn-ghost !py-1.5 !text-xs' : 'btn-primary !py-1.5 !text-xs'
                }`}
                onClick={() => purchase(item.id)}
              >
                {owned
                  ? 'Owned'
                  : installed
                    ? 'Installed'
                    : validation.ok
                      ? item.price === 0
                        ? 'Get it'
                        : `Buy for ${formatMoney(item.price)}`
                      : (validation.error ?? 'Unavailable')}
              </button>
            </div>
          )
        })}
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-violet-500/10 px-3 py-2 text-[11px] text-violet-100">
        <Sparkles size={14} className="mt-0.5 shrink-0" />
        <span>
          {save.lifestyle === 'LAPO'
            ? 'LAPO tip: mission rewards, daily study grants and lecture stipends stack up fast. Furnish one piece at a time.'
            : 'NEPO tip: your allowance covers premium furniture immediately, but do not ignore missions — they unlock progression.'}
        </span>
      </p>
    </Modal>
  )
}

export function shopItemExists(id: string): boolean {
  return Boolean(getItem(id))
}
