import { create } from 'zustand'
import type {
  Clock,
  InteractionId,
  Lifestyle,
  LocationId,
  PanelId,
  PlayerProfile,
  SaveData,
  Screen,
  Settings,
  ToastMessage,
} from '../types'
import { ACTIVITY_BY_ID, type ActivityOutcome } from './ActivitiesSystem'
import { applyAudioSettings, playSfx, startAmbience, stopAmbience, unlockAudio } from './audio'
import { HOSTELS, formatMoney } from './constants'
import { getItem, validatePurchase } from './EconomySystem'
import { applyStatDeltas, resolveEventEffect, rollEvent, type CampusEventDef } from './EventSystem'
import { LOCATIONS } from './locations'
import { evaluateMissions, MISSION_BY_ID } from './MissionSystem'
import { applyNeedDeltas, decayNeeds } from './NeedsSystem'
import { NPC_BY_ID } from './npcs'
import { HANGOUT_COST, HELP_MINUTES, bestGiftItem, relationshipScore } from './RelationshipSystem'
import { clearSave, createNewSave, loadSave, persistSave } from './SaveSystem'
import { addMinutes, formatClock, isWithinHours, weekdayName } from './timeState'

export interface DialogueState {
  npcId: string
  /** Short summary of what just happened. */
  headline: string
  /** Flavour lines to read. */
  lines: string[]
}

export interface EventResultState {
  title: string
  text: string
}

export interface GameStore {
  screen: Screen
  save: SaveData | null
  paused: boolean
  panel: PanelId | null
  dialogue: DialogueState | null
  activeEvent: CampusEventDef | null
  eventResult: EventResultState | null
  reveal: { lifestyle: Lifestyle; allowance: number } | null
  toasts: ToastMessage[]

  boot: () => void
  setScreen: (screen: Screen) => void
  newGame: (profile: PlayerProfile) => Lifestyle
  updateProfile: (profile: PlayerProfile) => void
  finishReveal: () => void
  continueGame: () => void
  returnToMenu: () => void
  resetSave: () => void

  setPaused: (value: boolean) => void
  togglePause: () => void
  setPanel: (panel: PanelId | null) => void
  pushToast: (toast: Omit<ToastMessage, 'id'>) => void
  dismissToast: (id: number) => void

  travelTo: (location: LocationId) => void
  doActivity: (activityId: string) => void
  acceptMission: (missionId: string) => void

  openNpc: (npcId: string) => void
  closeNpc: () => void
  interactNpc: (npcId: string, interactionId: InteractionId) => void

  resolveEvent: (choiceId: string) => void
  dismissEventResult: () => void

  purchase: (itemId: string) => boolean
  equipOutfit: (itemId: string) => void
  consumeItem: (itemId: string) => void
  updateSettings: (patch: Partial<Settings>) => void
}

let toastId = 0

function makeToast(toast: Omit<ToastMessage, 'id'>): ToastMessage {
  toastId += 1
  return { ...toast, id: toastId }
}

function relationshipDeltas(save: SaveData, deltas: Record<string, number>): SaveData {
  const relationships = { ...save.relationships }
  for (const [npcId, delta] of Object.entries(deltas)) {
    const next = (relationships[npcId] ?? 0) + delta
    relationships[npcId] = Math.max(0, Math.min(100, next))
  }
  return { ...save, relationships }
}

interface AdvanceOptions {
  asleep?: boolean
  override?: Clock
}

function advanceTime(
  save: SaveData,
  minutes: number,
  options: AdvanceOptions = {},
): { save: SaveData; daysPassed: number } {
  if (options.override) {
    const clock = options.override
    return { save: { ...save, clock }, daysPassed: Math.max(0, clock.day - save.clock.day) }
  }
  const { clock, daysPassed } = addMinutes(save.clock, minutes)
  let next: SaveData = { ...save, clock, needs: decayNeeds(save.needs, minutes, options.asleep) }
  if (daysPassed > 0) {
    next = {
      ...next,
      stats: {
        ...next.stats,
        daysPlayed: next.stats.daysPlayed + daysPassed,
        lastDay: clock.day,
        jobsToday: 0,
        jobDay: 0,
      },
    }
  }
  return { save: next, daysPassed }
}

export const useGame = create<GameStore>()((set, get) => {
  function push(toast: Omit<ToastMessage, 'id'>): void {
    set({ toasts: [...get().toasts.slice(-3), makeToast(toast)] })
  }

  function playActivitySfx(sfx: ActivityOutcome['sfx']): void {
    if (!sfx) return
    if (sfx === 'sleep') {
      playSfx('sleep')
      return
    }
    playSfx(sfx)
  }

  /** Applies a save mutation, re-evaluates missions, pays rewards and persists. */
  function commit(mutator: (save: SaveData) => SaveData): SaveData | null {
    const current = get().save
    if (!current) return null
    const { save: evaluated, completed } = evaluateMissions(mutator(current))
    let next = evaluated
    if (completed.length > 0) {
      const total = completed.reduce((sum, entry) => sum + entry.reward, 0)
      next = { ...next, balance: next.balance + total }
    }
    persistSave(next)
    set({ save: next })
    for (const entry of completed) {
      playSfx('reward')
      push({
        title: `Mission complete: ${entry.mission.title}`,
        body: `Reward +${formatMoney(entry.reward)}`,
        kind: 'reward',
      })
    }
    return next
  }

  function announceDay(clock: Clock): void {
    push({
      title: `Day ${clock.day} · ${weekdayName(clock.day)}`,
      body: `It is ${formatClock(clock.hour)}. Check your schedule for today.`,
      kind: 'info',
    })
  }

  function maybeEvent(save: SaveData, chance: number): void {
    if (chance <= 0) return
    if (Math.random() > chance) return
    const event = rollEvent(save, save.clock)
    if (!event) return
    set({ activeEvent: event, eventResult: null, panel: null, paused: false })
  }

  return {
    screen: 'menu',
    save: null,
    paused: false,
    panel: null,
    dialogue: null,
    activeEvent: null,
    eventResult: null,
    reveal: null,
    toasts: [],

    boot: () => {
      const save = loadSave()
      if (save) {
        applyAudioSettings(save.settings.masterVolume, save.settings.muted)
        set({ save })
      }
      set({ screen: 'menu' })
    },

    setScreen: (screen) => set({ screen }),

    newGame: (profile) => {
      const save = createNewSave(profile)
      persistSave(save)
      applyAudioSettings(save.settings.masterVolume, save.settings.muted)
      set({
        save,
        reveal: { lifestyle: save.lifestyle, allowance: save.balance },
        screen: 'reveal',
        dialogue: null,
        activeEvent: null,
        eventResult: null,
        panel: null,
        paused: false,
        toasts: [],
      })
      return save.lifestyle
    },

    updateProfile: (profile) => {
      const save = get().save
      if (!save) return
      const next: SaveData = {
        ...save,
        profile,
        gender: profile.gender,
        hostelId: HOSTELS[profile.gender].id,
        hostelName: HOSTELS[profile.gender].name,
        equipment: { ...save.equipment, outfitId: profile.outfitId },
      }
      persistSave(next)
      set({ save: next })
    },

    finishReveal: () => {
      const save = get().save
      if (!save) return
      const next = commit(() => ({ ...save, revealSeen: true, locationId: 'hostel' })) ?? save
      set({ screen: 'game', paused: false, panel: null, reveal: null })
      unlockAudio()
      startAmbience()
      push({
        title: 'Welcome to campus',
        body: 'You are in your hostel room. Tap objects or use the activity list to live your day.',
        kind: 'success',
      })
      maybeEvent(next, 0.35)
    },

    continueGame: () => {
      const save = loadSave()
      if (!save) return
      applyAudioSettings(save.settings.masterVolume, save.settings.muted)
      set({
        save,
        screen: 'game',
        paused: false,
        panel: null,
        dialogue: null,
        activeEvent: null,
        eventResult: null,
        reveal: null,
      })
      unlockAudio()
      startAmbience()
    },

    returnToMenu: () => {
      const save = get().save
      if (save) persistSave(save)
      stopAmbience()
      set({
        screen: 'menu',
        paused: false,
        panel: null,
        dialogue: null,
        activeEvent: null,
        eventResult: null,
        reveal: null,
      })
    },

    resetSave: () => {
      clearSave()
      stopAmbience()
      set({
        save: null,
        screen: 'menu',
        paused: false,
        panel: null,
        dialogue: null,
        activeEvent: null,
        eventResult: null,
        reveal: null,
        toasts: [],
      })
    },

    setPaused: (value) => set({ paused: value, panel: null }),

    togglePause: () => {
      const state = get()
      if (state.screen !== 'game') return
      if (state.activeEvent) return
      if (state.dialogue) {
        set({ dialogue: null })
        return
      }
      if (state.panel) {
        set({ panel: null })
        return
      }
      set({ paused: !state.paused })
    },

    setPanel: (panel) => set({ panel, dialogue: panel ? null : get().dialogue }),

    pushToast: (toast) => push(toast),

    dismissToast: (id) => set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),

    travelTo: (location) => {
      const save = get().save
      if (!save) return
      const target = LOCATIONS[location]
      if (save.locationId === location) {
        push({ title: `You are already at ${target.short}`, kind: 'info' })
        return
      }
      if (!isWithinHours(save.clock.hour, target.open[0], target.open[1])) {
        playSfx('error')
        push({
          title: `${target.short} is closed`,
          body: `Opening hours: ${formatClock(target.open[0])} – ${formatClock(target.open[1] % 24)}.`,
          kind: 'error',
        })
        return
      }
      const minutes = Math.max(5, target.travelMinutes)
      const moved = advanceTime(save, minutes)
      const visited = moved.save.stats.locationsVisited.includes(location)
        ? moved.save.stats.locationsVisited
        : [...moved.save.stats.locationsVisited, location]
      const next: SaveData = {
        ...moved.save,
        locationId: location,
        stats: { ...moved.save.stats, locationsVisited: visited },
      }
      commit(() => next)
      playSfx('door')
      push({
        title: `Arrived at ${target.name}`,
        body: `${minutes} min walk · ${formatClock(next.clock.hour)}`,
        kind: 'success',
      })
      if (moved.daysPassed > 0) announceDay(next.clock)
      maybeEvent(get().save ?? next, 0.28)
    },

    doActivity: (activityId) => {
      const save = get().save
      if (!save) return
      const activity = ACTIVITY_BY_ID[activityId]
      if (!activity) return
      const target = LOCATIONS[activity.location]
      if (activity.location !== save.locationId) {
        playSfx('error')
        push({ title: 'Not available here', body: `${activity.label} happens at ${target.short}.`, kind: 'error' })
        return
      }
      if (!isWithinHours(save.clock.hour, target.open[0], target.open[1])) {
        playSfx('error')
        push({
          title: `${target.short} is closed`,
          body: `Opening hours: ${formatClock(target.open[0])} – ${formatClock(target.open[1] % 24)}.`,
          kind: 'error',
        })
        return
      }
      if (activity.blocked) {
        const reason = activity.blocked(save, save.clock)
        if (reason) {
          playSfx('error')
          push({ title: 'Not right now', body: reason, kind: 'error' })
          return
        }
      }
      if (activity.requiresEnergy && save.needs.energy < activity.requiresEnergy) {
        playSfx('error')
        push({
          title: 'Too tired',
          body: `${activity.label} needs ${activity.requiresEnergy} energy. You have ${Math.round(save.needs.energy)}.`,
          kind: 'error',
        })
        return
      }
      if (activity.cost && save.balance < activity.cost) {
        playSfx('error')
        push({
          title: 'Not enough money',
          body: `${activity.label} costs ${formatMoney(activity.cost)}.`,
          kind: 'error',
        })
        return
      }

      const outcome = activity.run(save, save.clock)
      let next: SaveData = save
      if (outcome.balance) next = { ...next, balance: Math.max(0, next.balance + outcome.balance) }
      if (outcome.stats) next = { ...next, stats: { ...next.stats, ...outcome.stats } }
      if (outcome.relationships) next = relationshipDeltas(next, outcome.relationships)

      let daysPassed = 0
      if (outcome.clockOverride) {
        const targetDay =
          outcome.clockOverride.day > 0 ? outcome.clockOverride.day : save.clock.day + 1
        const moved = advanceTime(next, 0, {
          override: { day: targetDay, hour: outcome.clockOverride.hour },
        })
        next = moved.save
        daysPassed = moved.daysPassed
      } else if (activity.minutes > 0) {
        const moved = advanceTime(next, activity.minutes, { asleep: outcome.asleep })
        next = moved.save
        daysPassed = moved.daysPassed
      }

      if (outcome.needs) next = { ...next, needs: applyNeedDeltas(next.needs, outcome.needs) }

      commit(() => next)
      playActivitySfx(outcome.sfx)
      if (outcome.title) push({ title: outcome.title, body: outcome.body, kind: 'success' })

      const finalSave = get().save ?? next
      if (daysPassed > 0) announceDay(finalSave.clock)

      if (outcome.panel) {
        set({ panel: outcome.panel, dialogue: null })
        return
      }
      maybeEvent(finalSave, outcome.eventChance ?? (activity.minutes >= 45 ? 0.2 : 0.1))
    },

    acceptMission: (missionId) => {
      const save = get().save
      if (!save) return
      const def = MISSION_BY_ID[missionId]
      if (!def) return
      const current = save.missions[missionId]
      if (!current || current.status !== 'available') {
        push({ title: `${def.title} is already tracked`, kind: 'info' })
        return
      }
      commit((s) => ({
        ...s,
        missions: { ...s.missions, [missionId]: { status: 'active', counter: 0 } },
      }))
      playSfx('reward')
      push({ title: `New mission: ${def.title}`, body: def.objective, kind: 'success' })
    },

    openNpc: (npcId) => {
      const save = get().save
      if (!save) return
      const npc = NPC_BY_ID[npcId]
      if (!npc) return
      const met = relationshipScore(save, npcId) > 0 || save.stats.npcsTalked.includes(npcId)
      const lines = met ? [pickLine(npc.lines.chat)] : npc.lines.first
      playSfx('interact')
      set({
        dialogue: {
          npcId,
          headline: met ? `${npc.name} greets you` : `You have not met ${npc.name} yet`,
          lines,
        },
        panel: null,
      })
    },

    closeNpc: () => set({ dialogue: null }),

    interactNpc: (npcId, interactionId) => {
      const save = get().save
      if (!save) return
      const npc = NPC_BY_ID[npcId]
      if (!npc) return
      if (npc.location !== save.locationId) {
        playSfx('error')
        push({
          title: `${npc.name} is not here`,
          body: `You can find them at ${LOCATIONS[npc.location].short}.`,
          kind: 'error',
        })
        return
      }
      const score = relationshipScore(save, npcId)
      const socialBoost = socialMultiplier(save.needs.hygiene)

      let next: SaveData = save
      let lines: string[] = []
      let headline = ''
      let minutes = 20
      let eventChance = 0.3
      let sfx: ActivityOutcome['sfx'] = 'interact'

      const bump = (delta: number): void => {
        next = relationshipDeltas(next, { [npcId]: delta })
      }
      const gain = (deltas: Parameters<typeof applyNeedDeltas>[1]): void => {
        next = { ...next, needs: applyNeedDeltas(next.needs, deltas) }
      }

      switch (interactionId) {
        case 'introduce': {
          if (score > 0) {
            set({ dialogue: { npcId, headline: 'Already acquainted', lines: ['You two have already met.'] } })
            return
          }
          minutes = 10
          bump(8)
          gain({ social: Math.round(6 * socialBoost), happiness: 3 })
          lines = npc.lines.first
          headline = `You met ${npc.name}`
          next = {
            ...next,
            stats: {
              ...next.stats,
              npcsTalked: next.stats.npcsTalked.includes(npcId)
                ? next.stats.npcsTalked
                : [...next.stats.npcsTalked, npcId],
            },
          }
          break
        }
        case 'chat': {
          minutes = 20
          bump(Math.round(6 * socialBoost))
          gain({ social: Math.round(9 * socialBoost), happiness: 4, energy: -2 })
          lines = [pickLine(npc.lines.chat), pickLine(npc.lines.chat)]
          headline = `${npc.name} opened up`
          break
        }
        case 'joke': {
          minutes = 10
          const landed = Math.random() < 0.7
          if (landed) {
            bump(7)
            gain({ happiness: 8, social: 3 })
            lines = [npc.lines.joke]
            headline = 'The joke landed'
            sfx = 'reward'
          } else {
            bump(-3)
            gain({ happiness: -1 })
            lines = [npc.lines.jokeFlop]
            headline = 'The joke flopped'
            sfx = 'error'
          }
          break
        }
        case 'help': {
          minutes = HELP_MINUTES
          gain({ energy: -6 })
          const paid = Math.random() < 0.55
          if (paid) {
            next = { ...next, balance: next.balance + 1_500 }
            next = applyStatDeltas(next, { jobsDone: 1 })
            bump(5)
            lines = [pickLine(npc.lines.help), `${npc.name} hands you ₦1,500 for the trouble.`]
            headline = `Paid task from ${npc.name}`
            sfx = 'reward'
          } else {
            bump(3)
            gain({ academic: 5 })
            lines = [pickLine(npc.lines.help)]
            headline = `${npc.name} gave you advice`
          }
          break
        }
        case 'hangout': {
          if (score < 10) {
            playSfx('error')
            push({ title: 'Not close enough yet', body: 'Become an acquaintance first.', kind: 'error' })
            return
          }
          if (save.balance < HANGOUT_COST) {
            playSfx('error')
            push({
              title: 'Not enough money',
              body: `Hanging out costs ${formatMoney(HANGOUT_COST)} for snacks and transport.`,
              kind: 'error',
            })
            return
          }
          minutes = 120
          next = { ...next, balance: next.balance - HANGOUT_COST }
          bump(14)
          gain({
            social: Math.round(15 * socialBoost),
            happiness: 11,
            energy: -8,
            hunger: -8,
          })
          next = applyStatDeltas(next, { hangouts: 1 })
          lines = [npc.lines.hangout, 'Two hours later you are both laughing about nothing.']
          headline = `You hung out with ${npc.name}`
          eventChance = 0.4
          break
        }
        case 'gift': {
          const gift = bestGiftItem(save)
          if (!gift) {
            playSfx('error')
            push({ title: 'No gift to give', body: 'Buy chocolates or flowers at the Campus Mart.', kind: 'error' })
            return
          }
          minutes = 5
          const index = next.inventory.indexOf(gift.id)
          const inventory = [...next.inventory]
          if (index >= 0) inventory.splice(index, 1)
          next = { ...next, inventory }
          bump(gift.giftValue ?? 10)
          gain({ happiness: 5 })
          next = applyStatDeltas(next, { giftsGiven: 1 })
          lines = [npc.lines.gift, `You gave ${npc.name} a ${gift.name}.`]
          headline = `Gift given to ${npc.name}`
          sfx = 'reward'
          break
        }
      }

      const moved = advanceTime(next, minutes)
      next = moved.save
      commit(() => next)
      playActivitySfx(sfx)
      set({ dialogue: { npcId, headline, lines }, panel: null })
      const finalSave = get().save ?? next
      if (moved.daysPassed > 0) announceDay(finalSave.clock)
      maybeEvent(finalSave, eventChance)
    },

    resolveEvent: (choiceId) => {
      const save = get().save
      const active = get().activeEvent
      if (!save || !active) return
      const resolution = resolveEventEffect(save, active, choiceId)
      if (!resolution) {
        playSfx('error')
        push({
          title: 'Not right now',
          body: 'That option needs money you do not have.',
          kind: 'error',
        })
        return
      }

      const minutes = resolution.effect.minutes ?? 15
      const moved = advanceTime(resolution.save, minutes)
      const next = moved.save
      commit(() => next)
      playSfx('click')
      set({
        activeEvent: null,
        eventResult: { title: active.title, text: resolution.effect.result },
      })
      if (moved.daysPassed > 0) announceDay((get().save ?? next).clock)
    },

    dismissEventResult: () => set({ eventResult: null }),

    purchase: (itemId) => {
      const save = get().save
      if (!save) return false
      const item = getItem(itemId)
      if (!item) return false
      const result = validatePurchase(save.balance, itemId, save.equipment.furniture, save.inventory)
      if (!result.ok) {
        playSfx('error')
        push({ title: 'Purchase failed', body: result.error, kind: 'error' })
        return false
      }
      commit((s) => ({
        ...s,
        balance: s.balance - item.price,
        inventory:
          item.category === 'outfit' || item.category === 'consumable' || item.category === 'gift'
            ? [...s.inventory, item.id]
            : s.inventory,
        equipment:
          item.category === 'furniture' && item.slot
            ? { ...s.equipment, furniture: { ...s.equipment.furniture, [item.slot]: item.id } }
            : s.equipment,
        stats: {
          ...s.stats,
          furniturePurchased:
            item.category === 'furniture' ? s.stats.furniturePurchased + 1 : s.stats.furniturePurchased,
        },
      }))
      playSfx('buy')
      push({
        title: `${item.name} purchased`,
        body:
          item.category === 'furniture'
            ? 'Installed in your room instantly.'
            : 'Added to your inventory.',
        kind: 'success',
      })
      return true
    },

    equipOutfit: (itemId) => {
      const save = get().save
      if (!save) return
      const item = getItem(itemId)
      if (!item || item.category !== 'outfit' || !save.inventory.includes(itemId)) return
      commit((s) => ({
        ...s,
        equipment: { ...s.equipment, outfitId: itemId },
        profile: { ...s.profile, outfitId: itemId },
      }))
      playSfx('click')
      push({ title: `Now wearing ${item.name}`, kind: 'info' })
    },

    consumeItem: (itemId) => {
      const save = get().save
      if (!save) return
      const item = getItem(itemId)
      if (!item || item.category !== 'consumable' || !item.needs) return
      const index = save.inventory.indexOf(itemId)
      if (index < 0) return
      const inventory = [...save.inventory]
      inventory.splice(index, 1)
      const moved = advanceTime({ ...save, inventory }, 15)
      const next: SaveData = {
        ...moved.save,
        needs: applyNeedDeltas(moved.save.needs, item.needs),
      }
      commit(() => next)
      playSfx('pickup')
      const summary = Object.entries(item.needs)
        .map(([key, value]) => `${key} +${value}`)
        .join(', ')
      push({ title: `${item.name} used`, body: summary, kind: 'success' })
    },

    updateSettings: (patch) => {
      const save = get().save
      if (!save) return
      const next = { ...save, settings: { ...save.settings, ...patch } }
      persistSave(next)
      applyAudioSettings(next.settings.masterVolume, next.settings.muted)
      set({ save: next })
    },
  }
})

function pickLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)] ?? lines[0] ?? '...'
}

function socialMultiplier(hygiene: number): number {
  return hygiene < 20 ? 0.6 : 1
}
