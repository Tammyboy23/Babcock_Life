import { useState, type FormEvent } from 'react'
import { BookOpen, CircleDollarSign, MessageCircle, Send, ShoppingBag, Smartphone } from 'lucide-react'
import { formatMoney } from '../game/constants'
import { getItem, SHOP_ITEMS, validatePurchase } from '../game/EconomySystem'
import { NPCS } from '../game/npcs'
import { useGame } from '../game/GameState'
import type { NpcDef } from '../types'
import { AvatarPortrait } from './scenes'
import { Modal } from './ui'

type AppTab = 'messages' | 'study' | 'shop' | 'luck'
type ChatLine = { from: 'you' | 'them'; text: string }

const TABS: { id: AppTab; label: string; icon: typeof MessageCircle }[] = [
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'study', label: 'Study', icon: BookOpen },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'luck', label: 'Luck', icon: CircleDollarSign },
]

export function PhonePanel() {
  const save = useGame((state) => state.save)
  const setPanel = useGame((state) => state.setPanel)
  const purchase = useGame((state) => state.purchase)
  const phoneMessage = useGame((state) => state.phoneMessage)
  const submitAssignment = useGame((state) => state.submitAssignment)
  const placeBet = useGame((state) => state.placeBet)
  const [tab, setTab] = useState<AppTab>('messages')
  const [contact, setContact] = useState<NpcDef>(NPCS[0])
  const [draft, setDraft] = useState('')
  const [threads, setThreads] = useState<Record<string, ChatLine[]>>({})
  const [stake, setStake] = useState(500)

  if (!save) return null

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    const reply = phoneMessage(contact.id, text)
    if (!reply) return
    setThreads((current) => ({
      ...current,
      [contact.id]: [...(current[contact.id] ?? []), { from: 'you', text }, { from: 'them', text: reply }],
    }))
    setDraft('')
  }

  const ownedItem = (itemId: string) => {
    const item = getItem(itemId)
    if (!item) return false
    if (item.category === 'outfit') return save.inventory.includes(itemId)
    if (item.category === 'furniture' && item.slot) return save.equipment.furniture[item.slot] === itemId
    return !item.repeatable && save.inventory.includes(itemId)
  }

  return (
    <Modal
      title="Campus phone"
      subtitle="Messages, coursework, shopping and a little luck."
      icon={<Smartphone size={20} />}
      onClose={() => setPanel(null)}
      size="lg"
      footer={<div className="flex items-center justify-between text-xs"><span className="text-slate-400">Wallet</span><span className="font-bold text-amber-200">{formatMoney(save.balance)}</span></div>}
    >
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
        {TABS.map((entry) => {
          const Icon = entry.icon
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTab(entry.id)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg px-1 text-[9px] font-bold sm:flex-row sm:text-xs ${tab === entry.id ? 'bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-300/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
              aria-pressed={tab === entry.id}
            >
              <Icon size={15} /> {entry.label}
            </button>
          )
        })}
      </div>

      {tab === 'messages' && (
        <section className="grid min-h-[320px] gap-3 lg:grid-cols-[12rem_minmax(0,1fr)]">
          <div className="scroll-thin flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden">
            {NPCS.map((npc) => (
              <button
                key={npc.id}
                type="button"
                onClick={() => setContact(npc)}
                className={`flex shrink-0 items-center gap-2 rounded-xl border px-2 py-2 text-left lg:w-full ${contact.id === npc.id ? 'border-emerald-300/40 bg-emerald-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
              >
                <AvatarPortrait
                  look={{ gender: npc.gender, skinTone: npc.skinTone, hairStyle: npc.hairStyle, hairColor: npc.hairColor, outfitPrimary: npc.outfitPrimary, outfitSecondary: npc.outfitSecondary }}
                  size={34}
                />
                <span className="min-w-0 lg:block">
                  <span className="block text-[11px] font-bold text-white">{npc.name}</span>
                  <span className="hidden max-w-28 truncate text-[9px] text-slate-400 lg:block">{npc.tag}</span>
                </span>
              </button>
            ))}
          </div>

          <div className="flex min-h-[270px] min-w-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-black/20">
            <header className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <AvatarPortrait
                look={{ gender: contact.gender, skinTone: contact.skinTone, hairStyle: contact.hairStyle, hairColor: contact.hairColor, outfitPrimary: contact.outfitPrimary, outfitSecondary: contact.outfitSecondary }}
                size={32}
              />
              <div className="min-w-0"><div className="truncate text-xs font-bold text-white">{contact.name}</div><div className="truncate text-[9px] text-slate-400">{contact.tag}</div></div>
            </header>
            <div className="scroll-thin flex flex-1 flex-col gap-2 overflow-y-auto p-3">
              {(threads[contact.id] ?? []).length === 0 ? (
                <div className="m-auto max-w-xs text-center text-[11px] text-slate-400">Send {contact.name} a message to start a conversation.</div>
              ) : threads[contact.id].map((line, index) => (
                <p key={`${contact.id}-${index}`} className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${line.from === 'you' ? 'ml-auto bg-emerald-500/20 text-emerald-50' : 'bg-white/10 text-slate-100'}`}>{line.text}</p>
              ))}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 p-2">
              <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={160} placeholder={`Message ${contact.name}...`} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-emerald-300/50" />
              <button type="submit" className="btn-primary !h-9 !w-10 !p-0" aria-label="Send message"><Send size={15} /></button>
            </form>
          </div>
        </section>
      )}

      {tab === 'study' && (
        <section className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-950/50 to-slate-950/70 p-4 sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200"><BookOpen size={20} /></div>
          <h3 className="mt-3 text-base font-bold text-white">Assignment desk</h3>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-300">Work through a focused 45-minute study block from your phone. It raises academic progress and counts toward study missions.</p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-black/25 p-2"><div className="text-sm font-bold text-emerald-200">+10</div><div className="text-[9px] text-slate-400">Academic</div></div>
            <div className="rounded-lg bg-black/25 p-2"><div className="text-sm font-bold text-slate-200">45 min</div><div className="text-[9px] text-slate-400">Game time</div></div>
            <div className="rounded-lg bg-black/25 p-2"><div className="text-sm font-bold text-amber-200">8</div><div className="text-[9px] text-slate-400">Energy needed</div></div>
          </div>
          <button type="button" onClick={submitAssignment} disabled={save.needs.energy < 8} className="btn-primary mt-4 w-full sm:w-auto"><BookOpen size={15} /> Submit assignment</button>
          {save.needs.energy < 8 && <p className="mt-2 text-[10px] text-rose-200">Rest first. You need at least 8 energy.</p>}
        </section>
      )}

      {tab === 'shop' && (
        <section>
          <div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-bold text-white">Quick shop</h3><p className="text-[10px] text-slate-400">Purchases use your campus wallet.</p></div><ShoppingBag size={18} className="text-emerald-200" /></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SHOP_ITEMS.map((item) => {
              const owned = ownedItem(item.id)
              const available = validatePurchase(save.balance, item.id, save.equipment.furniture, save.inventory).ok
              return (
                <article key={item.id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="min-w-0"><h4 className="truncate text-xs font-bold text-white">{item.name}</h4><p className="mt-1 line-clamp-2 text-[10px] text-slate-400">{item.blurb}</p><p className="mt-1 text-[10px] font-bold text-amber-200">{item.price === 0 ? 'FREE' : formatMoney(item.price)}</p></div>
                  <button type="button" onClick={() => purchase(item.id)} disabled={owned || !available} className="btn-ghost shrink-0 !px-2 !py-1.5 !text-[10px]">{owned ? 'Owned' : available ? 'Buy' : 'Locked'}</button>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {tab === 'luck' && (
        <section className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-950/35 to-slate-950/70 p-4 sm:p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/15 text-amber-100"><CircleDollarSign size={20} /></div>
          <h3 className="mt-3 text-base font-bold text-white">Campus draw</h3>
          <p className="mt-1 max-w-lg text-xs leading-relaxed text-slate-300">Try your luck with fictional in-game money. A win doubles your stake; a loss costs the full stake. Each round takes 15 minutes of game time.</p>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choose stake">
            {[100, 500, 1_000, 2_500, 5_000].map((amount) => (
              <button key={amount} type="button" onClick={() => setStake(amount)} aria-pressed={stake === amount} className={`rounded-lg border px-3 py-2 text-[11px] font-bold ${stake === amount ? 'border-amber-200/50 bg-amber-200/15 text-amber-100' : 'border-white/10 bg-black/20 text-slate-300'}`}>{formatMoney(amount)}</button>
            ))}
          </div>
          <button type="button" disabled={save.balance < stake} onClick={() => placeBet(stake)} className="btn-gold mt-4 w-full sm:w-auto"><CircleDollarSign size={15} /> Play for {formatMoney(stake)}</button>
          <p className="mt-3 text-[10px] text-slate-400">Set a spending limit. This is a fictional game mechanic only; winnings are not guaranteed.</p>
        </section>
      )}
    </Modal>
  )
}
