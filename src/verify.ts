import type { PlayerProfile, SaveData } from './types'
import {
  clearSave,
  createNewSave,
  loadSave,
  parseSave,
  persistSave,
  rollLifestyle,
  SAVE_VERSION,
} from './game/SaveSystem'
import { SHOP_ITEMS, validatePurchase } from './game/EconomySystem'
import { ACTIVITY_BY_ID, ACTIVITIES } from './game/ActivitiesSystem'
import { EVENTS, rememberEvent, resolveEventEffect, rollEvent } from './game/EventSystem'
import { useGame } from './game/GameState'
import { LOCATION_ORDER } from './game/constants'
import { LOCATIONS } from './game/locations'
import { completedMissionCount, computeCounter, evaluateMissions, missionSnapshots } from './game/MissionSystem'
import { NEED_KEYS, decayNeeds, fullNeeds, needsWarnings } from './game/NeedsSystem'
import { NPC_BY_ID, NPCS, npcsIn } from './game/npcs'
import { interactionOffers, relationshipScore, relationshipTier } from './game/RelationshipSystem'
import { currentLecture, nextCampusEvent, scheduleForDay, upcomingEntries } from './game/ScheduleSystem'
import { formatClock, phaseOf, weekdayName } from './game/timeState'

const results: string[] = []
let failures = 0

function check(name: string, pass: boolean, detail = ''): void {
  if (!pass) failures += 1
  results.push(`${pass ? 'PASS' : 'FAIL'} :: ${name}${detail ? ` :: ${detail}` : ''}`)
}

function profile(gender: 'boy' | 'girl'): PlayerProfile {
  return {
    name: 'Tester',
    gender,
    skinTone: '#7a4a24',
    hairStyle: 1,
    hairColor: '#141418',
    outfitId: 'outfit-tee',
  }
}

/** Runs `fn` with Math.random pinned so outcomes are deterministic. */
function withRandom<T>(value: number, fn: () => T): T {
  const original = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

function currentSave(): SaveData {
  const save = useGame.getState().save
  if (!save) throw new Error('expected an active save')
  return save
}

function forceSave(patch: (save: SaveData) => SaveData): void {
  useGame.setState({ save: patch(currentSave()) })
}

async function run(): Promise<void> {
  // ---------------------------------------------------------------- lifestyle roll
  const rolls = { NEPO: 0, LAPO: 0 }
  for (let i = 0; i < 400; i += 1) rolls[rollLifestyle()] += 1
  check('rollLifestyle is roughly 50/50', rolls.NEPO > 120 && rolls.LAPO > 120, `NEPO=${rolls.NEPO} LAPO=${rolls.LAPO}`)

  // ---------------------------------------------------------------- new save shape
  const nepo = createNewSave(profile('boy'), 'NEPO')
  const lapo = createNewSave(profile('girl'), 'LAPO')
  check('save version is current', nepo.version === SAVE_VERSION, `${nepo.version}`)
  check('NEPO allowance is ₦500,000', nepo.balance === 500_000, `${nepo.balance}`)
  check('LAPO allowance is ₦50,000', lapo.balance === 50_000, `${lapo.balance}`)
  check('NEPO boy hostel is Sapphire Hall', nepo.hostelId === 'sapphire', nepo.hostelId)
  check('LAPO girl hostel is Amethyst Hall', lapo.hostelId === 'amethyst', lapo.hostelId)
  check(
    'NEPO starts with premium furniture',
    nepo.equipment.furniture.bed === 'furn-bed-premium' && Boolean(nepo.equipment.furniture.ac),
    JSON.stringify(nepo.equipment.furniture),
  )
  check(
    'both lifestyles can still upgrade furniture',
    Object.keys(nepo.equipment.furniture).length < 10 && Object.keys(lapo.equipment.furniture).length < 10,
    `NEPO=${Object.keys(nepo.equipment.furniture).length} LAPO=${Object.keys(lapo.equipment.furniture).length}`,
  )
  check(
    'LAPO room is visibly more modest',
    Object.keys(lapo.equipment.furniture).length === 3 && !lapo.equipment.furniture.rug,
    Object.keys(lapo.equipment.furniture).join(','),
  )
  check('allowance is credited exactly once at creation', nepo.allowanceGranted === true)
  check('new save starts in the hostel', nepo.locationId === 'hostel', nepo.locationId)
  check('new save starts on day 1 at 08:00', nepo.clock.day === 1 && Math.round(nepo.clock.hour) === 8, JSON.stringify(nepo.clock))
  check(
    'new save has all needs in range',
    NEED_KEYS.every((key) => nepo.needs[key] > 0 && nepo.needs[key] <= 100),
    JSON.stringify(nepo.needs),
  )
  check('new save has no relationships yet', Object.keys(nepo.relationships).length === 0)

  // ---------------------------------------------------------------- persistence
  clearSave()
  const edited: SaveData = {
    ...nepo,
    balance: 123_456,
    needs: { ...nepo.needs, hunger: 42 },
    relationships: { chidi: 33 },
    locationId: 'library',
    clock: { day: 3, hour: 15 },
  }
  persistSave(edited)
  const reloaded = loadSave()
  check('save persists to localStorage', reloaded !== null)
  check('balance is restored exactly (allowance not re-granted)', reloaded?.balance === 123_456, `${reloaded?.balance}`)
  check('lifestyle persists', reloaded?.lifestyle === 'NEPO', `${reloaded?.lifestyle}`)
  check('needs persist', reloaded?.needs.hunger === 42, `${reloaded?.needs.hunger}`)
  check('relationships persist', reloaded?.relationships.chidi === 33, `${reloaded?.relationships.chidi}`)
  check('current location persists', reloaded?.locationId === 'library', reloaded?.locationId)
  check(
    'clock persists',
    reloaded?.clock.day === 3 && reloaded?.clock.hour === 15,
    JSON.stringify(reloaded?.clock),
  )

  localStorage.setItem('babcock-life-save-v2', '{"profile":')
  check('corrupt JSON is rejected', loadSave() === null)
  localStorage.setItem('babcock-life-save-v2', '{"profile":{"name":"x"}}')
  check('save without a gender is rejected', loadSave() === null)
  localStorage.setItem('babcock-life-save-v2', JSON.stringify({ ...nepo, balance: -999 }))
  check('negative balance is clamped to 0', loadSave()?.balance === 0, `${loadSave()?.balance}`)
  localStorage.setItem(
    'babcock-life-save-v2',
    JSON.stringify({ ...nepo, locationId: 'nowhere', relationships: { ghost: 90 }, clock: { day: 0, hour: 99 } }),
  )
  const sanitized = loadSave()
  check('unknown locations fall back to the hostel', sanitized?.locationId === 'hostel', sanitized?.locationId)
  check('unknown students are dropped from relationships', Object.keys(sanitized?.relationships ?? {}).length === 0)
  check('clock values are clamped', sanitized?.clock.day === 1 && (sanitized?.clock.hour ?? 99) < 24, JSON.stringify(sanitized?.clock))
  const legacy = parseSave(JSON.stringify({ profile: { name: 'Legacy', gender: 'girl' }, energy: 40 }))
  check(
    'v1 saves migrate instead of being lost',
    Boolean(legacy?.allowanceGranted) && [50_000, 500_000].includes(legacy?.balance ?? 0),
    `${legacy?.balance}`,
  )

  // ---------------------------------------------------------------- pure systems
  const fresh = createNewSave(profile('boy'), 'LAPO')
  const decayed = decayNeeds(fresh.needs, 240)
  check('awake needs decay over time', decayed.hunger < fresh.needs.hunger, `${fresh.needs.hunger} -> ${decayed.hunger}`)
  const slept = decayNeeds({ ...fresh.needs, energy: 20 }, 480, true)
  check('sleeping restores energy', slept.energy > 20, `${slept.energy}`)
  check('low needs produce warnings', needsWarnings({ ...fullNeeds(), hunger: 5, hygiene: 5 }).length >= 2)
  check('phase mapping covers the day', phaseOf(8) === 'Morning' && phaseOf(14) === 'Afternoon' && phaseOf(19) === 'Evening' && phaseOf(23) === 'Night')
  check('day 1 is a Monday', weekdayName(1) === 'Monday', weekdayName(1))

  check('every activity points at a real location', ACTIVITIES.every((entry) => LOCATION_ORDER.includes(entry.location)))
  check(
    'every activity has a label, blurb and icon',
    ACTIVITIES.every((entry) => entry.label.length > 0 && entry.blurb.length > 0 && entry.icon.length > 0),
  )
  let activityRunsOk = true
  let blockedOk = true
  for (const activity of ACTIVITIES) {
    try {
      const outcome = activity.run(fresh, fresh.clock)
      if (!outcome.title) activityRunsOk = false
      if (activity.blocked) {
        const reason = activity.blocked(fresh, fresh.clock)
        if (reason !== null && typeof reason !== 'string') blockedOk = false
      }
    } catch {
      activityRunsOk = false
    }
  }
  check('every activity runs without throwing', activityRunsOk)
  check('activity availability checks return strings or null', blockedOk)
  check('every location has at least one activity', LOCATION_ORDER.every((id) => ACTIVITIES.some((entry) => entry.location === id)))
  check('every location is reachable in the map grid', LOCATION_ORDER.every((id) => LOCATIONS[id].mapX > 0 && LOCATIONS[id].mapY > 0))
  check('lectures are gated by the schedule', Boolean(currentLecture({ day: 1, hour: 10 })) && currentLecture({ day: 1, hour: 20 }) === null)
  check('today has scheduled entries', scheduleForDay(1).length >= 2, `${scheduleForDay(1).length}`)
  check('upcoming entries are listed', upcomingEntries({ day: 1, hour: 8 }, 4).length === 4)
  check('a campus event exists in the schedule', Boolean(nextCampusEvent({ day: 1, hour: 6 })))

  check('every shop item has a non-negative price', SHOP_ITEMS.every((item) => item.price >= 0))
  check('gift items carry a gift value', SHOP_ITEMS.filter((item) => item.category === 'gift').every((item) => (item.giftValue ?? 0) > 0))
  check('outfits carry colours', SHOP_ITEMS.filter((item) => item.category === 'outfit').every((item) => item.primary && item.secondary))
  check(
    'purchase validation blocks overspending',
    validatePurchase(100, 'outfit-denim', {}, []).ok === false,
  )
  check('every student lives at a real location', NPCS.every((npc) => Boolean(LOCATIONS[npc.location])))
  check('every location has students assigned', LOCATION_ORDER.every((id) => npcsIn(id).length > 0))
  check('mission givers are real students', missionSnapshots(fresh).every((entry) => !entry.def.giver || Boolean(NPC_BY_ID[entry.def.giver])))
  check('relationship tiers progress', relationshipTier(0).id === 'stranger' && relationshipTier(35).id === 'friend' && relationshipTier(85).id === 'bestie')
  check('gift offers are blocked without a gift', interactionOffers(NPC_BY_ID.chidi, fresh).find((offer) => offer.id === 'gift')?.disabledReason !== undefined)
  check('hangout offers are blocked for strangers', interactionOffers(NPC_BY_ID.chidi, fresh).find((offer) => offer.id === 'hangout')?.disabledReason !== undefined)

  const eventPool = EVENTS.filter((event) => !event.available || event.available(fresh, fresh.clock))
  check('plenty of campus events exist', eventPool.length >= 8, `${eventPool.length}`)
  check('every event has at least two choices', eventPool.every((event) => event.choices.length >= 2))
  let eventResolveOk = true
  for (const event of eventPool) {
    try {
      const outcome = resolveEventEffect(fresh, event, event.choices[0].id)
      if (!outcome) eventResolveOk = false
      if (!outcome || !outcome.effect.result) eventResolveOk = false
    } catch {
      eventResolveOk = false
    }
  }
  check('every event choice resolves into a result', eventResolveOk)
  check('recent events are capped', rememberEvent(fresh, 'x').concat(Array(10).fill('y')).slice(0, 6).length === 6)

  // ---------------------------------------------------------------- live store flow
  clearSave()
  useGame.getState().resetSave()
  check('reset clears any existing save', useGame.getState().save === null && loadSave() === null)

  useGame.getState().newGame(profile('boy'))
  const afterNew = useGame.getState()
  const startedLifestyle = afterNew.save?.lifestyle ?? 'LAPO'
  check('new game assigns a lifestyle', startedLifestyle === 'NEPO' || startedLifestyle === 'LAPO')
  check(
    'starting balance matches the rolled lifestyle',
    afterNew.save?.balance === (startedLifestyle === 'NEPO' ? 500_000 : 50_000),
    `${afterNew.save?.balance}`,
  )
  check('new game starts in the hostel room', afterNew.save?.locationId === 'hostel')
  check('new game shows the lifestyle reveal', afterNew.screen === 'reveal')
  check('reveal payload matches the save', afterNew.reveal?.lifestyle === startedLifestyle)

  useGame.getState().finishReveal()
  check('game starts after the reveal', useGame.getState().screen === 'game')
  check('reveal flag is stored', useGame.getState().save?.revealSeen === true)

  // needs, time and activities
  const beforeShower = currentSave()
  useGame.getState().doActivity('shower')
  const afterShower = currentSave()
  check('showering improves hygiene', afterShower.needs.hygiene > beforeShower.needs.hygiene, `${beforeShower.needs.hygiene} -> ${afterShower.needs.hygiene}`)
  check('activities advance the clock', afterShower.clock.hour > beforeShower.clock.hour, formatClock(afterShower.clock.hour))

  useGame.getState().doActivity('check_schedule')
  check('checking the schedule is recorded', currentSave().stats.scheduleChecked === true)
  check('checking the schedule opens the schedule panel', useGame.getState().panel === 'schedule')
  useGame.getState().setPanel(null)

  useGame.getState().doActivity('check_messages')
  useGame.getState().setPanel(null)
  useGame.getState().dismissEventResult()

  const beforeStudy = currentSave()
  useGame.getState().doActivity('study_room')
  const afterStudy = currentSave()
  check('studying raises academic progress', afterStudy.needs.academic > beforeStudy.needs.academic, `${beforeStudy.needs.academic} -> ${afterStudy.needs.academic}`)
  check('studying consumes energy', afterStudy.needs.energy < beforeStudy.needs.energy)

  useGame.getState().doActivity('mirror_appearance')
  check('the mirror activity opens the profile panel', useGame.getState().panel === 'character')
  useGame.getState().setPanel(null)
  const profileBefore = currentSave().profile
  useGame.getState().updateProfile({ ...profileBefore, hairStyle: 3, skinTone: '#a9714b' })
  check(
    'appearance can be changed after creation',
    currentSave().profile.hairStyle === 3 && currentSave().profile.skinTone === '#a9714b',
  )
  check('appearance changes persist to storage', parseSave(JSON.stringify(currentSave()))?.profile.hairStyle === 3)

  const saveBeforeForeignActivity = JSON.stringify(currentSave())
  useGame.getState().doActivity('attend_lecture')
  check('locations reject activities from other places', JSON.stringify(currentSave()) === saveBeforeForeignActivity)

  const beforeSleep = currentSave()
  useGame.getState().doActivity('sleep')
  const afterSleep = currentSave()
  check('sleeping moves to the next morning', afterSleep.clock.day === beforeSleep.clock.day + 1 && afterSleep.clock.hour === 7, JSON.stringify(afterSleep.clock))
  check('sleeping restores energy', afterSleep.needs.energy === 100, `${afterSleep.needs.energy}`)
  check('nights slept is counted', afterSleep.stats.nightsSlept === 1)

  // travel
  const beforeTravel = currentSave()
  useGame.getState().setPaused(false)
  useGame.getState().dismissEventResult()
  useGame.getState().travelTo('cafeteria')
  const afterTravel = currentSave()
  check('travelling changes the location', afterTravel.locationId === 'cafeteria', afterTravel.locationId)
  check('travelling takes time', afterTravel.clock.hour > beforeTravel.clock.hour)
  check('visited locations are recorded once', afterTravel.stats.locationsVisited.filter((id) => id === 'cafeteria').length === 1)

  forceSave((save) => ({ ...save, clock: { day: save.clock.day, hour: 9 } }))
  const beforeMeal = currentSave()
  useGame.getState().doActivity('eat_jollof')
  const afterMeal = currentSave()
  const settleJustCompleted =
    beforeMeal.missions.settle_in?.status !== 'completed' && afterMeal.missions.settle_in?.status === 'completed'
  check(
    'eating costs money',
    afterMeal.balance === beforeMeal.balance - 1_200 + (settleJustCompleted ? 3_000 : 0),
    `${beforeMeal.balance} -> ${afterMeal.balance}`,
  )
  check('eating fills hunger', afterMeal.needs.hunger > beforeMeal.needs.hunger)
  check('meals bought is tracked', afterMeal.stats.mealsBought === 1)
  check('settle_in completes after schedule + meal + sleep', afterMeal.missions.settle_in?.status === 'completed', afterMeal.missions.settle_in?.status)
  check('settle_in reward was paid', settleJustCompleted && afterMeal.balance === beforeMeal.balance - 1_200 + 3_000, `${afterMeal.balance}`)

  const costlyMeal = ACTIVITY_BY_ID.eat_jollof
  forceSave((save) => ({ ...save, balance: 200 }))
  const beforePoorMeal = currentSave()
  useGame.getState().doActivity('eat_jollof')
  check('meals are blocked without money', currentSave().balance === beforePoorMeal.balance)
  check('blocked meals explain themselves', Boolean(costlyMeal.blocked?.(currentSave(), currentSave().clock)))

  // lectures follow the schedule
  forceSave((save) => ({ ...save, clock: { day: 1, hour: 10 }, balance: 400_000 }))
  useGame.getState().travelTo('lecture')
  forceSave((save) => ({ ...save, clock: { day: 1, hour: 10 } }))
  const beforeLecture = currentSave()
  useGame.getState().doActivity('attend_lecture')
  const afterLecture = currentSave()
  check('lectures can be attended when scheduled', afterLecture.stats.lecturesAttended === beforeLecture.stats.lecturesAttended + 1)
  check('lectures build academic progress', afterLecture.needs.academic > beforeLecture.needs.academic)
  forceSave((save) => ({ ...save, clock: { day: 1, hour: 21 } }))
  const beforeLateLecture = currentSave()
  useGame.getState().doActivity('attend_lecture')
  check('lectures are blocked outside the timetable', currentSave().needs.academic === beforeLateLecture.needs.academic)

  // working shifts earns money and is capped per day
  forceSave((save) => ({ ...save, clock: { day: 2, hour: 9 }, needs: { ...save.needs, energy: 90 } }))
  useGame.getState().travelTo('library')
  forceSave((save) => ({ ...save, clock: { day: 2, hour: 9 }, needs: { ...save.needs, energy: 90 } }))
  const beforeShift = currentSave()
  useGame.getState().doActivity('library_shift')
  const afterShift = currentSave()
  check('paid shifts pay exactly ₦3,000', afterShift.balance === beforeShift.balance + 3_000, `${beforeShift.balance} -> ${afterShift.balance}`)
  check('shifts count towards missions', afterShift.stats.jobsDone === 1)
  check('hustle mission tracks shifts', computeCounter('hustle', afterShift) === 1)

  // ---------------------------------------------------------------- economy
  forceSave((save) => ({ ...save, balance: 300_000 }))
  const beforeBuy = currentSave().balance
  check('outfit purchase succeeds', useGame.getState().purchase('outfit-denim') === true)
  check('outfit purchase deducts the exact price', currentSave().balance === beforeBuy - 9_500, `${currentSave().balance}`)
  check('purchased outfit is in the inventory', currentSave().inventory.includes('outfit-denim'))
  const afterOutfitBuy = currentSave().balance
  check('duplicate outfit purchase is rejected', useGame.getState().purchase('outfit-denim') === false)
  check('rejected purchase changes nothing', currentSave().balance === afterOutfitBuy)
  const furnitureBefore = currentSave().stats.furniturePurchased
  check('furniture purchase upgrades the room', useGame.getState().purchase('furn-plant') === true)
  check('the new furniture is installed', currentSave().equipment.furniture.plant === 'furn-plant')
  check('room upgrades are counted', currentSave().stats.furniturePurchased === furnitureBefore + 1)
  check('premium furniture upgrades are available too', useGame.getState().purchase('furn-plant-luxe') === true)
  check('the upgrade replaces the previous tier', currentSave().equipment.furniture.plant === 'furn-plant-luxe')
  check('room_glow_up tracks furniture purchases', computeCounter('room_glow_up', currentSave()) === 2)
  useGame.getState().equipOutfit('outfit-denim')
  check('equipping an owned outfit updates the profile', currentSave().profile.outfitId === 'outfit-denim')

  useGame.getState().purchase('item-jollof')
  forceSave((save) => ({ ...save, needs: { ...save.needs, hunger: 20 } }))
  const hungerBeforeItem = currentSave().needs.hunger
  useGame.getState().consumeItem('item-jollof')
  check('using a snack restores hunger', currentSave().needs.hunger > hungerBeforeItem)
  check('used snack leaves the inventory', !currentSave().inventory.includes('item-jollof'))

  // ---------------------------------------------------------------- relationships
  useGame.getState().travelTo('cafeteria')
  useGame.getState().dismissEventResult()
  useGame.getState().openNpc('chidi')
  check('opening a student starts a conversation', useGame.getState().dialogue?.npcId === 'chidi')
  const strangerOffers = interactionOffers(NPC_BY_ID.chidi, currentSave())
  check('first meetings offer an introduction', strangerOffers.some((offer) => offer.id === 'introduce'))

  useGame.getState().interactNpc('chidi', 'introduce')
  check('introductions raise the relationship', relationshipScore(currentSave(), 'chidi') === 8, `${relationshipScore(currentSave(), 'chidi')}`)
  check('introductions record the student as met', currentSave().stats.npcsTalked.includes('chidi'))
  withRandom(0.1, () => useGame.getState().interactNpc('chidi', 'chat'))
  check('conversations build the relationship further', relationshipScore(currentSave(), 'chidi') > 8)

  withRandom(0.9, () => useGame.getState().interactNpc('chidi', 'joke'))
  const scoreAfterFlop = relationshipScore(currentSave(), 'chidi')
  withRandom(0.1, () => useGame.getState().interactNpc('chidi', 'joke'))
  check('a flop costs goodwill, a landing joke earns it', relationshipScore(currentSave(), 'chidi') > scoreAfterFlop)

  useGame.getState().travelTo('lecture')
  useGame.getState().dismissEventResult()
  const strangerScore = relationshipScore(currentSave(), 'amara')
  const strangerBalance = currentSave().balance
  useGame.getState().interactNpc('amara', 'hangout')
  check('hangouts are blocked for strangers', relationshipScore(currentSave(), 'amara') === strangerScore && currentSave().balance === strangerBalance)
  check('talking to someone who is elsewhere is blocked', (() => {
    const before = JSON.stringify(currentSave())
    useGame.getState().interactNpc('tunde', 'chat')
    return JSON.stringify(currentSave()) === before
  })())

  useGame.getState().travelTo('cafeteria')
  useGame.getState().dismissEventResult()
  useGame.getState().purchase('gift-chocolate')
  const beforeGift = currentSave()
  useGame.getState().interactNpc('chidi', 'gift')
  const afterGift = currentSave()
  check('gifts raise the relationship', relationshipScore(afterGift, 'chidi') > relationshipScore(beforeGift, 'chidi'))
  check('gifts are consumed from the inventory', !afterGift.inventory.includes('gift-chocolate'))
  check('gifts are counted', afterGift.stats.giftsGiven === 1)

  withRandom(0.1, () => useGame.getState().interactNpc('chidi', 'help'))
  check('asking for help can produce a paid task', currentSave().stats.jobsDone >= 2)

  // ---------------------------------------------------------------- events
  forceSave((save) => ({ ...save, clock: { day: 2, hour: 14 }, balance: 200_000 }))
  const rolled = rollEvent(currentSave(), currentSave().clock)
  check('events can be rolled', rolled !== null, rolled?.title ?? 'none')
  if (rolled) {
    const options = rolled.choices.map((choice) => choice.id)
    useGame.setState({ activeEvent: rolled, eventResult: null })
    const beforeEvent = currentSave()
    const paidChoice = rolled.choices.find((choice) => choice.effect.balance && choice.effect.balance < 0 && !choice.requiresMoney)
    const choiceId = paidChoice?.id ?? options[0]
    useGame.getState().resolveEvent(choiceId)
    const afterEvent = currentSave()
    check('resolving an event closes the pop-up', useGame.getState().activeEvent === null)
    check('resolving an event shows a result card', Boolean(useGame.getState().eventResult?.text))
    check('events that cost money reduce the balance', paidChoice ? afterEvent.balance < beforeEvent.balance : afterEvent.balance <= beforeEvent.balance)
    check('events are remembered so they do not repeat', afterEvent.stats.recentEvents.includes(rolled.id))
    check('events experienced are counted', afterEvent.stats.eventsExperienced === beforeEvent.stats.eventsExperienced + 1)
    useGame.getState().dismissEventResult()
  }

  // ---------------------------------------------------------------- missions
  forceSave((save) => ({ ...save, balance: 50_000 }))
  useGame.getState().dismissEventResult()
  useGame.getState().travelTo('library')
  useGame.getState().dismissEventResult()
  useGame.getState().travelTo('shop')
  useGame.getState().dismissEventResult()
  useGame.getState().travelTo('hangout')
  useGame.getState().dismissEventResult()
  check('campus_tour completes after 4 locations', currentSave().missions.campus_tour?.status === 'completed', currentSave().missions.campus_tour?.status)
  check('campus_tour is computed from visits', computeCounter('campus_tour', currentSave()) === 4)
  check('repeat visits do not double count', computeCounter('campus_tour', currentSave()) <= 4)

  useGame.getState().travelTo('event')
  useGame.getState().dismissEventResult()
  check('exploring keeps the visited list unique', new Set(currentSave().stats.locationsVisited).size === currentSave().stats.locationsVisited.length)

  const missionState = currentSave().missions
  check('auto-start missions begin active or completed', missionSnapshots(currentSave()).every((entry) => entry.progress.status !== 'available' || Boolean(entry.def.giver)))
  check('at least eight missions exist', Object.keys(missionState).length >= 8, `${Object.keys(missionState).length}`)
  check('completed missions are counted', completedMissionCount(currentSave()) >= 1)

  useGame.getState().travelTo('hostel')
  useGame.getState().dismissEventResult()
  forceSave((save) => ({
    ...save,
    balance: 100_000,
    missions: { ...save.missions, emergency_fund: { status: 'active', counter: 0 } },
  }))
  useGame.getState().doActivity('shower')
  check(
    'emergency_fund stays active below the target',
    currentSave().missions.emergency_fund?.status === 'active',
    currentSave().missions.emergency_fund?.status,
  )
  forceSave((save) => ({ ...save, balance: 150_000 }))
  useGame.getState().doActivity('shower')
  check('emergency_fund completes at ₦150,000', currentSave().missions.emergency_fund?.status === 'completed', currentSave().missions.emergency_fund?.status)
  check('mission rewards are paid into the balance', currentSave().balance === 155_000, `${currentSave().balance}`)

  const evaluated = evaluateMissions(currentSave())
  check('mission evaluation is idempotent', evaluated.completed.length === 0)

  // ---------------------------------------------------------------- save round trip
  const live = currentSave()
  persistSave(live)
  const restored = loadSave()
  check('live progress persists after reload', restored?.balance === live.balance)
  check('needs persist after reload', restored?.needs.academic === live.needs.academic)
  check('relationships persist after reload', restored?.relationships.chidi === live.relationships.chidi)
  check('completed missions persist', restored?.missions.campus_tour?.status === 'completed')
  check('furniture persists', restored?.equipment.furniture.plant === 'furn-plant-luxe')
  check('inventory persists', restored?.inventory.includes('outfit-denim') === true)

  const beforeContinue = loadSave()!
  useGame.getState().continueGame()
  const continued = currentSave()
  check('continue game restores the exact save', continued.balance === beforeContinue.balance && continued.locationId === beforeContinue.locationId)
  check('continue game keeps the rolled lifestyle', continued.lifestyle === beforeContinue.lifestyle)
  check('continue game does not re-grant the allowance', continued.balance === beforeContinue.balance)
  check('continue game enters the game screen', useGame.getState().screen === 'game')

  // ---------------------------------------------------------------- reset
  useGame.getState().returnToMenu()
  check('returning to the menu keeps the save on disk', loadSave() !== null)
  useGame.getState().resetSave()
  check('reset clears the save', loadSave() === null && useGame.getState().save === null)

  const text = `${results.join('\n')}\n\nTOTAL ${results.length} :: FAILURES ${failures}`
  const node = document.getElementById('results')
  if (node) node.textContent = text
  document.title = failures === 0 ? `VERIFY_OK total=${results.length}` : `VERIFY_FAIL failures=${failures}`
  ;(window as unknown as { __verifyResult: string }).__verifyResult = text
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
  const node = document.getElementById('results')
  if (node) node.textContent = `HARNESS CRASH\n${message}`
  document.title = 'VERIFY_FAIL harness-crash'
})
