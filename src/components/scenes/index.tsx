import { useState, type ComponentType, type ReactNode } from 'react'
import {
  Backpack,
  Banknote,
  Bed,
  Book,
  Bookmark,
  Briefcase,
  Calendar,
  Coffee,
  CupSoda,
  DoorOpen,
  Droplets,
  Dumbbell,
  Footprints,
  GraduationCap,
  Mail,
  MapPin,
  MessageSquare,
  Moon,
  Music,
  PartyPopper,
  Search,
  Shirt,
  ShoppingBag,
  Smile,
  Sofa,
  Sparkles,
  Trophy,
  Utensils,
  Users,
} from 'lucide-react'
import type { LocationId, SaveData, TimePhase } from '../../types'
import { PHASE_PALETTE } from '../../game/constants'
import { SHOP_BY_ID as OUTFITS, furnitureTier } from '../../game/EconomySystem'
import { NPC_BY_ID as ALL_NPCS, npcsIn } from '../../game/npcs'
import { SceneAvatar, type AvatarLook } from './Avatar'
import { Environment3D } from './Environment3D'

export { AvatarBody, AvatarPortrait, SceneAvatar } from './Avatar'
export type { AvatarLook } from './Avatar'

export interface HotspotDef {
  id: string
  x: number
  y: number
  label: string
  icon: string
  kind: 'activity' | 'npc' | 'travel'
  target: string
  hint?: string
}

export interface SceneProps {
  save: SaveData
  phase: TimePhase
  onActivity: (activityId: string) => void
  onNpc: (npcId: string) => void
  onTravel: () => void
}

const ICONS: Record<string, ComponentType<{ size?: number }>> = {
  bed: Bed,
  moon: Moon,
  droplets: Droplets,
  book: Book,
  bookmark: Bookmark,
  shirt: Shirt,
  sofa: Sofa,
  calendar: Calendar,
  backpack: Backpack,
  mail: Mail,
  sparkles: Sparkles,
  coffee: Coffee,
  utensils: Utensils,
  cup: CupSoda,
  users: Users,
  briefcase: Briefcase,
  graduation: GraduationCap,
  message: MessageSquare,
  search: Search,
  dumbbell: Dumbbell,
  trophy: Trophy,
  cart: ShoppingBag,
  music: Music,
  party: PartyPopper,
  banknote: Banknote,
  footprints: Footprints,
  door: DoorOpen,
  map: MapPin,
  smile: Smile,
}

export function SceneIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = ICONS[name] ?? Sparkles
  return <Icon size={size} />
}

function pct(value: number, total: number): number {
  return (value / total) * 100
}

const SPOT: Record<LocationId, { x: number; y: number; scale: number; sitting?: boolean }[]> = {
  hostel: [{ x: 596, y: 250, scale: 0.6 }],
  cafeteria: [
    { x: 232, y: 206, scale: 0.58 },
    { x: 540, y: 302, scale: 0.55 },
  ],
  lecture: [
    { x: 206, y: 188, scale: 0.58 },
    { x: 486, y: 296, scale: 0.52, sitting: true },
  ],
  library: [
    { x: 352, y: 236, scale: 0.56, sitting: true },
    { x: 626, y: 300, scale: 0.54, sitting: true },
  ],
  sports: [{ x: 286, y: 244, scale: 0.58 }],
  shop: [{ x: 336, y: 232, scale: 0.58 }],
  hangout: [
    { x: 258, y: 262, scale: 0.56 },
    { x: 462, y: 302, scale: 0.54 },
    { x: 628, y: 250, scale: 0.53 },
  ],
  event: [
    { x: 322, y: 300, scale: 0.56 },
    { x: 520, y: 268, scale: 0.54 },
  ],
}

function npcLook(npcId: string): AvatarLook | null {
  const npc = ALL_NPCS[npcId]
  if (!npc) return null
  return {
    gender: npc.gender,
    skinTone: npc.skinTone,
    hairStyle: npc.hairStyle,
    hairColor: npc.hairColor,
    outfitPrimary: npc.outfitPrimary,
    outfitSecondary: npc.outfitSecondary,
  }
}


function Students({ location }: { location: LocationId }) {
  const spots = SPOT[location]
  const npcs = npcsIn(location)
  return (
    <g>
      {npcs.map((npc, index) => {
        const spot = spots[index % spots.length]
        const look = npcLook(npc.id)
        if (!look) return null
        return (
          <SceneAvatar
            key={npc.id}
            look={look}
            x={spot.x}
            y={spot.y}
            scale={spot.scale}
            sitting={spot.sitting}
          />
        )
      })}
    </g>
  )
}

function npcHotspots(location: LocationId): HotspotDef[] {
  const spots = SPOT[location]
  return npcsIn(location).map((npc, index) => {
    const spot = spots[index % spots.length]
    return {
      id: `npc-${npc.id}`,
      x: pct(spot.x + 50 * spot.scale, 800),
      y: pct(spot.y - 40 * spot.scale, 460),
      label: npc.name,
      hint: npc.tag,
      icon: 'users',
      kind: 'npc' as const,
      target: npc.id,
    }
  })
}

function sceneLooking(save: SaveData): AvatarLook {
  return {
    gender: save.gender,
    skinTone: save.profile.skinTone,
    hairStyle: save.profile.hairStyle,
    hairColor: save.profile.hairColor,
    outfitPrimary: outfitColors(save).primary,
    outfitSecondary: outfitColors(save).secondary,
  }
}

function outfitColors(save: SaveData): { primary: string; secondary: string } {
  const item = OUTFITS[save.equipment.outfitId]
  if (!item?.primary || !item.secondary) return { primary: '#f8fafc', secondary: '#2f5d9e' }
  return { primary: item.primary, secondary: item.secondary }
}


// --------------------------------------------------------------------- frame

interface SceneFrameProps {
  location: LocationId
  phase: TimePhase
  label: string
  hotspots: HotspotDef[]
  onActivity: (id: string) => void
  onNpc: (id: string) => void
  onTravel: () => void
  animated: boolean
  children: ReactNode
}

function SceneFrame({
  location,
  phase,
  label,
  hotspots,
  onActivity,
  onNpc,
  onTravel,
  animated,
}: SceneFrameProps) {
  const palette = PHASE_PALETTE[phase] ?? PHASE_PALETTE.Morning
  const [activityCue, setActivityCue] = useState<{ id: string; key: number } | null>(null)
  const [cueKey, setCueKey] = useState(0)
  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-slate-950">
      <Environment3D location={location} phase={phase} activityCue={activityCue} />

      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: palette.tint }}
        aria-hidden="true"
      />

      <div className="scene-action-dock absolute inset-x-0 bottom-0 z-10 flex max-w-full gap-1 overflow-x-auto bg-slate-950/60 p-1.5 backdrop-blur-sm sm:inset-0 sm:overflow-visible sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:pointer-events-none">
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => {
              if (spot.kind === 'activity') {
                const nextKey = cueKey + 1
                setCueKey(nextKey)
                setActivityCue({ id: spot.target, key: nextKey })
                onActivity(spot.target)
              }
              else if (spot.kind === 'npc') onNpc(spot.target)
              else onTravel()
            }}
            className="group pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-xl border border-white/25 bg-slate-950/70 px-2 py-1 text-[11px] font-semibold text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-[60%] hover:border-violet-300/70 hover:bg-violet-600/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 max-sm:!relative max-sm:!left-auto max-sm:!top-auto max-sm:!h-9 max-sm:!w-9 max-sm:!shrink-0 max-sm:!transform-none max-sm:!p-0 max-sm:!justify-center"
            style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
            title={spot.hint ? `${spot.label} — ${spot.hint}` : spot.label}
            aria-label={spot.hint ? `${spot.label} — ${spot.hint}` : spot.label}
          >
            <span className="flex items-center gap-1.5">
              <SceneIcon name={spot.icon} />
              <span className="whitespace-nowrap max-sm:hidden">{spot.label}</span>
            </span>
          </button>
        ))}
      </div>

      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-slate-950/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-200 backdrop-blur">
        {label} · {palette.label}
      </span>
    </div>
  )
}

function Sky({ phase }: { phase: TimePhase }) {
  const palette = PHASE_PALETTE[phase] ?? PHASE_PALETTE.Morning
  return (
    <>
      <defs>
        <linearGradient id={`sky-${phase}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.sky[0]} />
          <stop offset="100%" stopColor={palette.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="800" height="460" fill={`url(#sky-${phase})`} />
      {phase === 'Night' && (
        <g fill="#e2e8ff" opacity="0.9">
          <circle cx="90" cy="60" r="2" />
          <circle cx="180" cy="110" r="1.6" />
          <circle cx="300" cy="54" r="2.2" />
          <circle cx="430" cy="96" r="1.8" />
          <circle cx="560" cy="50" r="2" />
          <circle cx="690" cy="104" r="1.5" />
          <circle cx="740" cy="40" r="2.1" />
          <circle cx="240" cy="170" r="1.4" />
        </g>
      )}
      {phase !== 'Night' && (
        <circle cx="690" cy="70" r="34" fill={palette.accent} opacity="0.85" />
      )}
      {phase === 'Night' && <circle cx="690" cy="70" r="26" fill="#f8fafc" opacity="0.85" />}
    </>
  )
}

// -------------------------------------------------------------------- hostel

function HostelScene({ save, phase, ...handlers }: SceneProps) {
  const furn = save.equipment.furniture
  const bedTier = furnitureTier(furn, 'bed')
  const deskTier = furnitureTier(furn, 'desk')
  const chairTier = furnitureTier(furn, 'chair')
  const hasRug = Boolean(furn.rug)
  const hasPlant = Boolean(furn.plant)
  const hasArt = Boolean(furn.art)
  const hasFridge = Boolean(furn.fridge)
  const hasShelf = Boolean(furn.shelf)
  const hasLamp = Boolean(furn.lamp)
  const hasAc = Boolean(furn.ac)
  const premium = save.lifestyle === 'NEPO'
  const wall = premium ? '#f2e4cf' : '#e7e1d4'
  const floor = premium ? '#b98a5a' : '#a98e6d'
  const accent = premium ? '#f5c451' : '#4ade80'

  const hotspots: HotspotDef[] = [
    { id: 'bed', x: pct(150, 800), y: pct(300, 460), label: 'Bed', icon: 'bed', kind: 'activity', target: 'sleep' },
    { id: 'nap', x: pct(215, 800), y: pct(320, 460), label: 'Nap', icon: 'moon', kind: 'activity', target: 'nap' },
    { id: 'wardrobe', x: pct(700, 800), y: pct(210, 460), label: 'Wardrobe', icon: 'shirt', kind: 'activity', target: 'change_outfit' },
    { id: 'desk', x: pct(470, 800), y: pct(300, 460), label: 'Desk', icon: 'book', kind: 'activity', target: 'study_room' },
    { id: 'shower', x: pct(640, 800), y: pct(120, 460), label: 'Shower', icon: 'droplets', kind: 'activity', target: 'shower' },
    { id: 'schedule', x: pct(392, 800), y: pct(196, 460), label: 'Schedule', icon: 'calendar', kind: 'activity', target: 'check_schedule' },
    { id: 'phone', x: pct(540, 800), y: pct(276, 460), label: 'Phone', icon: 'mail', kind: 'activity', target: 'check_messages' },
    { id: 'belongings', x: pct(332, 800), y: pct(378, 460), label: 'Belongings', icon: 'backpack', kind: 'activity', target: 'check_belongings' },
    { id: 'decorate', x: pct(258, 800), y: pct(150, 460), label: 'Decorate', icon: 'sofa', kind: 'activity', target: 'decorate_room' },
    { id: 'mirror', x: pct(624, 800), y: pct(168, 460), label: 'Mirror', icon: 'sparkles', kind: 'activity', target: 'mirror_appearance' },
    { id: 'door', x: pct(748, 800), y: pct(330, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('hostel'),
  ]

  return (
    <SceneFrame location="hostel" phase={phase} label={save.hostelName} hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <rect width="800" height="460" fill={wall} />
      <rect y="300" width="800" height="160" fill={floor} />
      <rect y="292" width="800" height="10" fill="rgba(0,0,0,0.12)" />

      {/* window with the outside world showing through */}
      <g>
        <rect x="40" y="60" width="180" height="120" rx="6" fill="#f8fafc" />
        <rect x="48" y="68" width="164" height="104" rx="4" fill={`url(#sky-${phase})`} />
        <rect x="124" y="68" width="8" height="104" fill="#f1f5f9" />
        <rect x="48" y="116" width="164" height="8" fill="#f1f5f9" />
      </g>

      {hasAc && (
        <g>
          <rect x="252" y="58" width="118" height="46" rx="8" fill="#f8fafc" stroke="#cbd5e1" />
          <rect x="266" y="70" width="90" height="8" rx="4" fill="#e2e8f0" />
          <circle cx="352" cy="92" r="5" fill="#22c55e" />
        </g>
      )}

      {hasArt && (
        <g>
          <rect x="420" y="70" width="104" height="72" rx="4" fill="#ffffff" stroke="#a16207" />
          <path d="M436 128 L470 92 L496 120 L508 104 L508 128 Z" fill="#0ea5e9" opacity="0.8" />
        </g>
      )}

      {hasShelf && (
        <g>
          <rect x="556" y="70" width="96" height="150" rx="6" fill="#8b5a2b" />
          <rect x="564" y="80" width="80" height="10" fill="#a16207" />
          <rect x="564" y="122" width="80" height="10" fill="#a16207" />
          <rect x="564" y="164" width="80" height="10" fill="#a16207" />
          <rect x="570" y="92" width="12" height="30" fill="#ef4444" />
          <rect x="586" y="96" width="12" height="26" fill="#3b82f6" />
          <rect x="602" y="90" width="12" height="32" fill="#22c55e" />
          <rect x="570" y="134" width="12" height="30" fill="#a855f7" />
          <rect x="586" y="138" width="12" height="26" fill="#f97316" />
        </g>
      )}

      {/* bed */}
      <g>
        {bedTier >= 2 && <rect x="52" y="214" width="14" height="120" rx="6" fill="#7c3f13" />}
        <rect x={bedTier >= 2 ? 62 : 76} y="246" width={bedTier >= 2 ? 176 : 150} height="14" rx="6" fill="#78350f" />
        <rect
          x={bedTier >= 2 ? 62 : 76}
          y={bedTier >= 2 ? 196 : 220}
          width={bedTier >= 2 ? 176 : 150}
          height={bedTier >= 2 ? 54 : 32}
          rx="10"
          fill={bedTier >= 1 ? '#e2e8f0' : '#cbd5e1'}
        />
        <rect
          x={bedTier >= 2 ? 62 : 76}
          y={bedTier >= 2 ? 188 : 214}
          width={bedTier >= 2 ? 176 : 150}
          height="16"
          rx="8"
          fill={bedTier >= 2 ? accent : '#94a3b8'}
          opacity="0.9"
        />
        {bedTier >= 1 && <rect x={bedTier >= 2 ? 88 : 100} y={bedTier >= 2 ? 194 : 216} width="52" height="20" rx="8" fill="#ffffff" />}
        <rect x={bedTier >= 2 ? 70 : 84} y="258" width="28" height="40" rx="6" fill="#64748b" />
        <rect x={bedTier >= 2 ? 200 : 186} y="258" width="28" height="40" rx="6" fill="#64748b" />
      </g>

      {hasRug && (
        <g>
          <ellipse cx="470" cy="404" rx="150" ry="34" fill="#b45309" opacity="0.75" />
          <ellipse cx="470" cy="404" rx="104" ry="22" fill="#f59e0b" opacity="0.6" />
        </g>
      )}

      {/* desk + chair */}
      <g>
        <rect x="392" y={deskTier >= 1 ? 234 : 244} width={deskTier >= 1 ? 176 : 132} height="12" rx="5" fill="#8b5a2b" />
        <rect x="404" y="246" width="12" height="60" fill="#7c4a21" />
        <rect x={deskTier >= 1 ? 544 : 512} y="246" width="12" height="60" fill="#7c4a21" />
        {deskTier >= 1 && <rect x="520" y="196" width="44" height="40" rx="4" fill="#0f172a" />}
        {deskTier >= 1 && <rect x="470" y="222" width="60" height="12" rx="4" fill="#e2e8f0" />}
        <rect x="420" y="222" width="40" height="12" rx="4" fill="#94a3b8" />
        {hasLamp && (
          <g>
            <rect x="446" y="196" width="6" height="26" fill="#475569" />
            <path d="M430 200 L468 200 L460 186 L438 186 Z" fill="#facc15" />
          </g>
        )}
      </g>

      <g>
        <rect x={chairTier >= 1 ? 330 : 336} y={chairTier >= 1 ? 288 : 292} width="58" height="52" rx="10" fill={chairTier >= 1 ? '#1f2937' : '#f8fafc'} stroke={chairTier >= 1 ? '#0f172a' : '#cbd5e1'} />
        <rect x={chairTier >= 1 ? 330 : 336} y={chairTier >= 1 ? 332 : 336} width="58" height="14" rx="7" fill={chairTier >= 1 ? '#0f172a' : '#e2e8f0'} />
      </g>

      {hasFridge && (
        <g>
          <rect x="300" y="212" width="72" height="118" rx="8" fill="#e2e8f0" stroke="#94a3b8" />
          <rect x="308" y="222" width="56" height="42" rx="4" fill="#f8fafc" stroke="#94a3b8" />
          <rect x="352" y="240" width="6" height="24" rx="3" fill="#64748b" />
          <rect x="352" y="290" width="6" height="24" rx="3" fill="#64748b" />
        </g>
      )}

      {hasPlant && (
        <g>
          <path d="M262 372 L306 372 L298 410 L270 410 Z" fill="#b45309" />
          <path d="M284 372 Q258 336 276 306 Q292 340 284 372Z" fill="#16a34a" />
          <path d="M284 372 Q312 338 300 306 Q280 340 284 372Z" fill="#22c55e" />
        </g>
      )}

      {/* wardrobe, mirror and door */}
      <g>
        <rect x="664" y="188" width="104" height="184" rx="8" fill="#78350f" />
        <rect x="676" y="200" width="80" height="76" rx="4" fill="#92400e" />
        <rect x="676" y="286" width="80" height="70" rx="4" fill="#92400e" />
        <circle cx="706" cy="240" r="5" fill={accent} />
        <circle cx="726" cy="240" r="5" fill={accent} />
        <circle cx="706" cy="322" r="5" fill={accent} />
      </g>
      <g>
        <ellipse cx="620" cy="126" rx="34" ry="44" fill="#bae6fd" opacity="0.7" stroke="#e2e8f0" strokeWidth="4" />
      </g>
      <g>
        <rect x="718" y="300" width="70" height="112" rx="6" fill="#7c4a21" />
        <rect x="726" y="312" width="54" height="88" rx="4" fill="#a16207" />
        <circle cx="772" cy="356" r="5" fill="#facc15" />
      </g>

      <SceneAvatar look={sceneLooking(save)} x={352} y={248} scale={0.62} />
      <Students location="hostel" />
    </SceneFrame>
  )
}

// ----------------------------------------------------------------- cafeteria

function CafeteriaScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'breakfast', x: pct(200, 800), y: pct(232, 460), label: 'Breakfast ₦350', icon: 'coffee', kind: 'activity', target: 'eat_breakfast' },
    { id: 'jollof', x: pct(360, 800), y: pct(232, 460), label: 'Jollof ₦1,200', icon: 'utensils', kind: 'activity', target: 'eat_jollof' },
    { id: 'beans', x: pct(500, 800), y: pct(238, 460), label: 'Beans ₦700', icon: 'utensils', kind: 'activity', target: 'eat_beans' },
    { id: 'chapman', x: pct(620, 800), y: pct(244, 460), label: 'Chapman ₦600', icon: 'cup', kind: 'activity', target: 'buy_chapman' },
    { id: 'shift', x: pct(140, 800), y: pct(330, 460), label: 'Work a shift', icon: 'briefcase', kind: 'activity', target: 'cafeteria_shift' },
    { id: 'gist', x: pct(430, 800), y: pct(150, 460), label: 'Menu board', icon: 'users', kind: 'activity', target: 'chat_mama' },
    { id: 'exit', x: pct(756, 800), y: pct(360, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('cafeteria'),
  ]

  return (
    <SceneFrame location="cafeteria" phase={phase} label="Amala Food Court" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <rect width="800" height="460" fill="#f6ead2" />
      <rect y="300" width="800" height="160" fill="#d8b47c" />
      <g stroke="#c9a469" strokeWidth="2">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <line key={`v-${index}`} x1={index * 100} y1="300" x2={index * 100 - 60} y2="460" />
        ))}
        {[0, 1, 2].map((index) => (
          <line key={`h-${index}`} x1="0" y1={330 + index * 42} x2="800" y2={330 + index * 42} />
        ))}
      </g>

      {/* menu board */}
      <g>
        <rect x="330" y="60" width="240" height="96" rx="8" fill="#1f2937" />
        <rect x="342" y="72" width="216" height="72" rx="4" fill="#0f172a" />
        <text x="356" y="96" fill="#facc15" fontSize="16" fontWeight="700" fontFamily="Trebuchet MS, sans-serif">
          TODAY
        </text>
        <text x="356" y="118" fill="#e2e8f0" fontSize="13" fontFamily="Trebuchet MS, sans-serif">
          Jollof · Beans · Bread
        </text>
        <text x="356" y="136" fill="#93c5fd" fontSize="12" fontFamily="Trebuchet MS, sans-serif">
          Chapman ₦600 · Small chops
        </text>
      </g>

      {/* counter */}
      <g>
        <rect x="60" y="196" width="620" height="26" rx="6" fill="#b45309" />
        <rect x="66" y="222" width="608" height="72" rx="4" fill="#d97746" />
        <rect x="66" y="222" width="608" height="10" fill="#f0ab6b" />
        {[120, 240, 320, 440, 520, 600].map((x) => (
          <rect key={`tray-${x}`} x={x} y="200" width="54" height="16" rx="4" fill="#e2e8f0" />
        ))}
        <rect x="200" y="188" width="90" height="12" rx="4" fill="#f8fafc" opacity="0.85" />
        <rect x="400" y="184" width="70" height="16" rx="4" fill="#f8fafc" opacity="0.75" />
      </g>

      {/* pots with steam */}
      <g>
        <ellipse cx="150" cy="196" rx="40" ry="12" fill="#475569" />
        <ellipse cx="480" cy="196" rx="44" ry="13" fill="#475569" />
        <g fill="#f8fafc" opacity="0.55">
          <circle cx="140" cy="170" r="8" />
          <circle cx="156" cy="156" r="10" />
          <circle cx="470" cy="168" r="9" />
          <circle cx="492" cy="152" r="11" />
        </g>
      </g>

      {/* tables */}
      {[
        { x: 170, y: 350 },
        { x: 430, y: 372 },
        { x: 650, y: 348 },
      ].map((table) => (
        <g key={`table-${table.x}`}>
          <ellipse cx={table.x} cy={table.y} rx="70" ry="22" fill="#a16207" />
          <ellipse cx={table.x} cy={table.y - 6} rx="70" ry="22" fill="#d9a15f" />
          <rect x={table.x - 8} y={table.y + 6} width="16" height="34" fill="#78350f" />
          <rect x={table.x - 66} y={table.y + 14} width="42" height="12" rx="5" fill="#7c4a21" />
          <rect x={table.x + 24} y={table.y + 14} width="42" height="12" rx="5" fill="#7c4a21" />
        </g>
      ))}

      <SceneAvatar look={sceneLooking(save)} x={604} y={288} scale={0.58} />
      <Students location="cafeteria" />
    </SceneFrame>
  )
}

// ------------------------------------------------------------------- lecture

function LectureScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'lecture', x: pct(180, 800), y: pct(300, 460), label: 'Attend lecture', icon: 'graduation', kind: 'activity', target: 'attend_lecture' },
    { id: 'ask', x: pct(600, 800), y: pct(196, 460), label: 'Ask a question', icon: 'message', kind: 'activity', target: 'ask_lecturer' },
    { id: 'group', x: pct(430, 800), y: pct(330, 460), label: 'Study group', icon: 'users', kind: 'activity', target: 'group_study' },
    { id: 'revise', x: pct(650, 800), y: pct(356, 460), label: 'Revise alone', icon: 'book', kind: 'activity', target: 'revise_theatre' },
    { id: 'exit', x: pct(760, 800), y: pct(390, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('lecture'),
  ]

  return (
    <SceneFrame location="lecture" phase={phase} label="Science Lecture Theatre" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <rect width="800" height="460" fill="#e8ecf5" />
      <rect y="286" width="800" height="174" fill="#9aa3b5" />
      <rect y="278" width="800" height="12" fill="#7c8598" />

      {/* whiteboard */}
      <g>
        <rect x="230" y="56" width="360" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="4" />
        <text x="256" y="96" fill="#1e293b" fontSize="20" fontFamily="Trebuchet MS, sans-serif" fontWeight="700">
          CSC 201 — Data Structures
        </text>
        <text x="256" y="126" fill="#334155" fontSize="15" fontFamily="Trebuchet MS, sans-serif">
          Big-O · Stacks · Queues
        </text>
        <text x="256" y="152" fill="#0ea5e9" fontSize="15" fontFamily="Trebuchet MS, sans-serif">
          Assignment due Friday 12:00
        </text>
        <rect x="256" y="168" width="150" height="6" rx="3" fill="#93c5fd" />
        <rect x="420" y="168" width="90" height="6" rx="3" fill="#fca5a5" />
      </g>

      {/* fans */}
      <g>
        {[140, 660].map((x) => (
          <g key={`fan-${x}`}>
            <rect x={x} y="46" width="6" height="20" fill="#64748b" />
            <circle cx={x + 3} cy="74" r="18" fill="#cbd5e1" />
            <path d={`M${x - 12} 74 L${x + 18} 74`} stroke="#94a3b8" strokeWidth="4" />
          </g>
        ))}
      </g>

      {/* podium */}
      <g>
        <rect x="106" y="250" width="150" height="20" rx="6" fill="#8b5a2b" />
        <rect x="120" y="270" width="122" height="80" rx="6" fill="#a16207" />
        <rect x="132" y="282" width="98" height="10" rx="4" fill="#f5deb3" />
      </g>

      {/* seat rows */}
      {[300, 348, 396].map((y, row) => (
        <g key={`row-${y}`}>
          {[0, 1, 2, 3, 4, 5, 6].map((index) => {
            const x = 300 + index * 78 + (row % 2) * 12
            return (
              <g key={`seat-${x}`}>
                <rect x={x} y={y} width="58" height="34" rx="8" fill="#5b6478" />
                <rect x={x + 6} y={y - 12} width="46" height="14" rx="6" fill="#6b7488" />
              </g>
            )
          })}
        </g>
      ))}

      <SceneAvatar look={sceneLooking(save)} x={466} y={296} scale={0.56} sitting />
      <Students location="lecture" />
    </SceneFrame>
  )
}

// ------------------------------------------------------------------- library

const BOOK_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f97316', '#0ea5e9', '#eab308']

function Shelf({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="150" height="220" rx="6" fill="#8b5a2b" />
      {[0, 1, 2, 3].map((row) => (
        <g key={`shelf-${x}-${row}`}>
          <rect x={x + 8} y={y + 12 + row * 54} width="134" height="8" fill="#6b3d1b" />
          {[0, 1, 2, 3, 4, 5, 6].map((book) => (
            <rect
              key={`book-${x}-${row}-${book}`}
              x={x + 14 + book * 18}
              y={y + 22 + row * 54}
              width="12"
              height={book % 3 === 0 ? 40 : 34}
              rx="2"
              fill={BOOK_COLORS[(row * 7 + book) % BOOK_COLORS.length]}
            />
          ))}
        </g>
      ))}
    </g>
  )
}

function LibraryScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'study', x: pct(400, 800), y: pct(320, 460), label: 'Study session', icon: 'book', kind: 'activity', target: 'study_library' },
    { id: 'research', x: pct(560, 800), y: pct(360, 460), label: 'Deep research', icon: 'search', kind: 'activity', target: 'deep_research' },
    { id: 'borrow', x: pct(120, 800), y: pct(180, 460), label: 'Borrow books', icon: 'bookmark', kind: 'activity', target: 'borrow_books' },
    { id: 'shift', x: pct(690, 800), y: pct(200, 460), label: 'Library shift', icon: 'briefcase', kind: 'activity', target: 'library_shift' },
    { id: 'students', x: pct(250, 800), y: pct(340, 460), label: 'Chat at tables', icon: 'users', kind: 'activity', target: 'library_students' },
    { id: 'exit', x: pct(770, 800), y: pct(410, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('library'),
  ]

  return (
    <SceneFrame location="library" phase={phase} label="Alumni Library" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <rect width="800" height="460" fill="#f0e7d6" />
      <rect y="300" width="800" height="160" fill="#c8a878" />
      <rect y="292" width="800" height="10" fill="rgba(0,0,0,0.1)" />

      <Shelf x={40} y={70} />
      <Shelf x={620} y={70} />

      {/* windows */}
      <g>
        {[300, 420].map((x) => (
          <g key={`window-${x}`}>
            <rect x={x} y="80" width="90" height="120" rx="6" fill="#f8fafc" />
            <rect x={x + 8} y="88" width="74" height="104" rx="4" fill={`url(#sky-${phase})`} />
          </g>
        ))}
      </g>

      {/* reading tables */}
      {[
        { x: 400, y: 300 },
        { x: 620, y: 356 },
      ].map((table) => (
        <g key={`table-${table.x}`}>
          <rect x={table.x - 110} y={table.y} width="220" height="16" rx="6" fill="#a16207" />
          <rect x={table.x - 96} y={table.y + 16} width="14" height="52" fill="#7c4a21" />
          <rect x={table.x + 82} y={table.y + 16} width="14" height="52" fill="#7c4a21" />
          <path d={`M${table.x - 30} ${table.y - 8} L${table.x + 10} ${table.y - 8} L${table.x + 2} ${table.y - 34} L${table.x - 22} ${table.y - 34} Z`} fill="#15803d" />
          <rect x={table.x + 40} y={table.y - 18} width="34" height="18" rx="3" fill="#f8fafc" stroke="#94a3b8" />
        </g>
      ))}

      <rect x="60" y="330" width="120" height="16" rx="4" fill="#7c4a21" />
      <rect x="700" y="336" width="72" height="90" rx="6" fill="#0f172a" opacity="0.85" />
      <text x="712" y="386" fill="#e2e8f0" fontSize="14" fontFamily="Trebuchet MS, sans-serif" transform="rotate(-90 712 386)">
        SILENCE
      </text>

      <SceneAvatar look={sceneLooking(save)} x={276} y={292} scale={0.56} sitting />
      <Students location="library" />
    </SceneFrame>
  )
}

// -------------------------------------------------------------------- sports

function SportsScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'workout', x: pct(180, 800), y: pct(320, 460), label: 'Work out', icon: 'dumbbell', kind: 'activity', target: 'workout' },
    { id: 'match', x: pct(400, 800), y: pct(300, 460), label: 'Football match', icon: 'trophy', kind: 'activity', target: 'join_match' },
    { id: 'coach', x: pct(300, 800), y: pct(248, 460), label: 'Train with Tunde', icon: 'footprints', kind: 'activity', target: 'coach_session' },
    { id: 'ref', x: pct(640, 800), y: pct(330, 460), label: 'Ref a match', icon: 'briefcase', kind: 'activity', target: 'ref_match' },
    { id: 'exit', x: pct(760, 800), y: pct(410, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('sports'),
  ]

  return (
    <SceneFrame location="sports" phase={phase} label="Sports Centre" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <Sky phase={phase} />
      <rect y="250" width="800" height="210" fill="#3f9d5b" />
      <rect y="250" width="800" height="18" fill="#357f4b" />
      <g stroke="#e2e8f0" strokeWidth="3" opacity="0.7" fill="none">
        <rect x="60" y="276" width="680" height="150" rx="6" />
        <line x1="400" y1="276" x2="400" y2="426" />
        <circle cx="400" cy="351" r="40" />
      </g>
      <g>
        <rect x="66" y="290" width="14" height="86" fill="#f8fafc" />
        <rect x="66" y="290" width="52" height="14" fill="#f8fafc" />
        <rect x="706" y="290" width="14" height="86" fill="#f8fafc" />
        <rect x="668" y="290" width="52" height="14" fill="#f8fafc" />
      </g>

      {/* basketball court + hoop */}
      <g>
        <rect x="560" y="60" width="200" height="120" rx="8" fill="#b45309" opacity="0.85" />
        <rect x="596" y="88" width="128" height="70" rx="6" fill="none" stroke="#f8fafc" strokeWidth="3" />
        <rect x="664" y="180" width="10" height="70" fill="#cbd5e1" />
        <rect x="640" y="152" width="56" height="10" rx="4" fill="#f8fafc" />
        <path d="M650 162 L686 162 L682 186 L654 186 Z" fill="none" stroke="#f87171" strokeWidth="3" />
      </g>

      {/* bleachers */}
      <g>
        <rect x="40" y="196" width="220" height="18" rx="6" fill="#94a3b8" />
        <rect x="56" y="214" width="188" height="18" rx="6" fill="#8391a5" />
        <rect x="72" y="232" width="156" height="18" rx="6" fill="#6f7d92" />
      </g>

      <SceneAvatar look={sceneLooking(save)} x={398} y={244} scale={0.58} />
      <Students location="sports" />
    </SceneFrame>
  )
}

// ---------------------------------------------------------------------- shop

function ShopScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'browse', x: pct(300, 800), y: pct(240, 460), label: 'Browse shelves', icon: 'cart', kind: 'activity', target: 'browse_shop' },
    { id: 'shift', x: pct(560, 800), y: pct(300, 460), label: 'Cashier shift', icon: 'briefcase', kind: 'activity', target: 'shop_shift' },
    { id: 'gist', x: pct(430, 800), y: pct(150, 460), label: 'Gist with Uche', icon: 'users', kind: 'activity', target: 'shop_gist' },
    { id: 'exit', x: pct(752, 800), y: pct(394, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('shop'),
  ]

  return (
    <SceneFrame location="shop" phase={phase} label="Campus Mart" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <rect width="800" height="460" fill="#e6f1e4" />
      <rect y="300" width="800" height="160" fill="#c6cdc4" />
      <rect y="292" width="800" height="10" fill="rgba(0,0,0,0.1)" />

      {/* signage */}
      <g>
        <rect x="250" y="54" width="300" height="62" rx="10" fill="#15803d" />
        <text x="400" y="94" fill="#f8fafc" fontSize="26" fontWeight="700" textAnchor="middle" fontFamily="Trebuchet MS, sans-serif">
          CAMPUS MART
        </text>
      </g>

      {/* shelves */}
      {[
        { x: 70, y: 130 },
        { x: 250, y: 130 },
      ].map((shelf) => (
        <g key={`shelf-${shelf.x}`}>
          <rect x={shelf.x} y={shelf.y} width="150" height="160" rx="6" fill="#cbd5e1" stroke="#94a3b8" />
          {[0, 1, 2].map((row) => (
            <g key={`row-${shelf.x}-${row}`}>
              <rect x={shelf.x + 8} y={shelf.y + 40 + row * 46} width="134" height="8" fill="#94a3b8" />
              {[0, 1, 2, 3, 4].map((item) => (
                <rect
                  key={`item-${shelf.x}-${row}-${item}`}
                  x={shelf.x + 14 + item * 26}
                  y={shelf.y + 14 + row * 46}
                  width="20"
                  height="26"
                  rx="4"
                  fill={BOOK_COLORS[(row * 5 + item + shelf.x / 10) % BOOK_COLORS.length]}
                />
              ))}
            </g>
          ))}
        </g>
      ))}

      {/* drinks fridge */}
      <g>
        <rect x="440" y="112" width="150" height="180" rx="8" fill="#0f172a" opacity="0.9" />
        <rect x="450" y="122" width="130" height="160" rx="6" fill="#1e293b" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect
              key={`bottle-${row}-${col}`}
              x={458 + col * 24}
              y={130 + row * 38}
              width="14"
              height="28"
              rx="4"
              fill={row % 2 === 0 ? '#38bdf8' : '#f97316'}
            />
          )),
        )}
      </g>

      {/* counter + till */}
      <g>
        <rect x="450" y="300" width="300" height="24" rx="6" fill="#16a34a" />
        <rect x="458" y="324" width="284" height="70" rx="4" fill="#22c55e" opacity="0.8" />
        <rect x="596" y="268" width="70" height="34" rx="6" fill="#334155" />
        <rect x="606" y="276" width="50" height="12" rx="4" fill="#a5f3fc" />
      </g>

      <rect x="60" y="330" width="220" height="70" rx="8" fill="#f8fafc" stroke="#94a3b8" />
      <text x="80" y="362" fill="#0f172a" fontSize="16" fontFamily="Trebuchet MS, sans-serif">
        Outfits · Snacks · Gifts
      </text>
      <text x="80" y="386" fill="#475569" fontSize="13" fontFamily="Trebuchet MS, sans-serif">
        Room upgrades upstairs
      </text>

      <SceneAvatar look={sceneLooking(save)} x={250} y={278} scale={0.58} />
      <Students location="shop" />
    </SceneFrame>
  )
}

// ------------------------------------------------------------------- hangout

function HangoutScene({ save, phase, ...handlers }: SceneProps) {
  const evening = phase === 'Evening' || phase === 'Night'
  const hotspots: HotspotDef[] = [
    { id: 'chill', x: pct(200, 800), y: pct(320, 460), label: 'Chill with friends', icon: 'users', kind: 'activity', target: 'hangout_friends' },
    { id: 'tt', x: pct(520, 800), y: pct(340, 460), label: 'Table tennis', icon: 'trophy', kind: 'activity', target: 'table_tennis' },
    { id: 'mic', x: pct(360, 800), y: pct(220, 460), label: 'Open mic', icon: 'music', kind: 'activity', target: 'open_mic' },
    { id: 'games', x: pct(660, 800), y: pct(300, 460), label: 'Board games', icon: 'sparkles', kind: 'activity', target: 'board_games' },
    { id: 'exit', x: pct(770, 800), y: pct(410, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('hangout'),
  ]

  return (
    <SceneFrame location="hangout" phase={phase} label="Student Union Pavilion" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <Sky phase={phase} />
      <rect y="270" width="800" height="190" fill="#4f7d4a" />
      <rect y="270" width="800" height="16" fill="#3f6b3c" />

      {/* pavilion roof and pillars */}
      <g>
        <path d="M60 150 L400 66 L740 150 L740 168 L60 168 Z" fill="#8a4f2d" />
        <path d="M60 150 L400 66 L740 150 L740 160 L400 84 L60 160 Z" fill="#a16207" />
        <rect x="96" y="168" width="22" height="150" fill="#7c4a21" />
        <rect x="682" y="168" width="22" height="150" fill="#7c4a21" />
        <rect x="386" y="120" width="22" height="196" fill="#7c4a21" />
      </g>

      {evening && (
        <g>
          {[120, 220, 320, 420, 520, 620, 700].map((x) => (
            <circle key={`light-${x}`} cx={x} cy={178 + Math.sin(x) * 6} r="7" fill="#fde68a" />
          ))}
          <path d="M110 172 Q400 210 710 172" stroke="#facc15" strokeWidth="2" fill="none" opacity="0.7" />
        </g>
      )}

      {/* benches */}
      {[
        { x: 150, y: 330 },
        { x: 400, y: 372 },
        { x: 640, y: 348 },
      ].map((bench) => (
        <g key={`bench-${bench.x}`}>
          <rect x={bench.x} y={bench.y} width="150" height="16" rx="6" fill="#a16207" />
          <rect x={bench.x} y={bench.y - 24} width="150" height="12" rx="6" fill="#8b5a2b" />
          <rect x={bench.x + 10} y={bench.y + 16} width="12" height="26" fill="#78350f" />
          <rect x={bench.x + 128} y={bench.y + 16} width="12" height="26" fill="#78350f" />
        </g>
      ))}

      {/* table tennis table */}
      <g>
        <rect x="470" y="300" width="150" height="14" rx="4" fill="#1d4ed8" />
        <rect x="470" y="288" width="150" height="14" rx="4" fill="#2563eb" />
        <line x1="545" y1="288" x2="545" y2="302" stroke="#f8fafc" strokeWidth="3" />
        <rect x="482" y="314" width="10" height="30" fill="#334155" />
        <rect x="596" y="314" width="10" height="30" fill="#334155" />
      </g>

      {/* speakers */}
      <g>
        <rect x="266" y="212" width="70" height="94" rx="8" fill="#1f2937" />
        <circle cx="301" cy="248" r="24" fill="#0f172a" />
        <circle cx="301" cy="248" r="12" fill="#374151" />
        <circle cx="301" cy="288" r="10" fill="#0f172a" />
      </g>

      <SceneAvatar look={sceneLooking(save)} x={372} y={288} scale={0.58} />
      <Students location="hangout" />
    </SceneFrame>
  )
}

// --------------------------------------------------------------------- event

function EventScene({ save, phase, ...handlers }: SceneProps) {
  const hotspots: HotspotDef[] = [
    { id: 'attend', x: pct(400, 800), y: pct(300, 460), label: 'Join the event', icon: 'party', kind: 'activity', target: 'attend_event' },
    { id: 'volunteer', x: pct(180, 800), y: pct(320, 460), label: 'Volunteer', icon: 'briefcase', kind: 'activity', target: 'volunteer_event' },
    { id: 'network', x: pct(620, 800), y: pct(330, 460), label: 'Network', icon: 'users', kind: 'activity', target: 'network_crowd' },
    { id: 'stage', x: pct(400, 800), y: pct(200, 460), label: 'Perform', icon: 'music', kind: 'activity', target: 'perform_stage' },
    { id: 'exit', x: pct(772, 800), y: pct(410, 460), label: 'Leave', icon: 'door', kind: 'travel', target: 'map' },
    ...npcHotspots('event'),
  ]

  return (
    <SceneFrame location="event" phase={phase} label="Campus Event Ground" hotspots={hotspots} animated={save.settings.animations} {...handlers}>
      <Sky phase={phase} />
      <rect y="280" width="800" height="180" fill="#6b7f4a" />
      <rect y="280" width="800" height="14" fill="#57683b" />

      {/* stage */}
      <g>
        <rect x="200" y="196" width="400" height="24" rx="6" fill="#1f2937" />
        <rect x="212" y="220" width="376" height="70" rx="4" fill="#334155" />
        <rect x="240" y="120" width="320" height="70" rx="8" fill="#be185d" />
        <text x="400" y="164" fill="#fdf2f8" fontSize="26" fontWeight="700" textAnchor="middle" fontFamily="Trebuchet MS, sans-serif">
          STUDENT WEEK
        </text>
        <rect x="286" y="82" width="12" height="40" fill="#e2e8f0" />
        <rect x="502" y="82" width="12" height="40" fill="#e2e8f0" />
        <circle cx="292" cy="76" r="10" fill="#facc15" />
        <circle cx="508" cy="76" r="10" fill="#38bdf8" />
      </g>

      {/* speaker stacks */}
      {[130, 640].map((x) => (
        <g key={`stack-${x}`}>
          <rect x={x} y="196" width="80" height="110" rx="8" fill="#111827" />
          <circle cx={x + 40} cy="232" r="26" fill="#0b1220" />
          <circle cx={x + 40} cy="286" r="18" fill="#0b1220" />
        </g>
      ))}

      {/* spotlights */}
      <g opacity="0.28">
        <path d="M292 84 L200 280 L320 280 Z" fill="#fde68a" />
        <path d="M508 84 L480 280 L600 280 Z" fill="#bae6fd" />
      </g>

      {/* food stand */}
      <g>
        <rect x="576" y="248" width="180" height="90" rx="8" fill="#b45309" />
        <rect x="576" y="228" width="180" height="24" rx="8" fill="#dc2626" />
        <text x="666" y="288" fill="#fff7ed" fontSize="16" textAnchor="middle" fontFamily="Trebuchet MS, sans-serif">
          SUYA & JOLLOF
        </text>
      </g>

      {/* crowd */}
      <g opacity="0.85">
        {[60, 110, 160, 210, 260, 700, 740].map((x, index) => (
          <g key={`crowd-${x}`}>
            <circle cx={x} cy={318 + (index % 3) * 6} r="13" fill="#1f2937" />
            <rect x={x - 14} y={332 + (index % 3) * 6} width="28" height="40" rx="12" fill="#374151" />
          </g>
        ))}
      </g>

      <SceneAvatar look={sceneLooking(save)} x={318} y={288} scale={0.58} />
      <Students location="event" />
    </SceneFrame>
  )
}

export function SceneForLocation(props: SceneProps) {
  switch (props.save.locationId) {
    case 'cafeteria':
      return <CafeteriaScene {...props} />
    case 'lecture':
      return <LectureScene {...props} />
    case 'library':
      return <LibraryScene {...props} />
    case 'sports':
      return <SportsScene {...props} />
    case 'shop':
      return <ShopScene {...props} />
    case 'hangout':
      return <HangoutScene {...props} />
    case 'event':
      return <EventScene {...props} />
    default:
      return <HostelScene {...props} />
  }
}
