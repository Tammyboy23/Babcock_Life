import type { Gender } from '../../types'

export interface AvatarLook {
  gender: Gender
  skinTone: string
  hairStyle: number
  hairColor: string
  outfitPrimary: string
  outfitSecondary: string
}

function shade(hex: string, amount: number): string {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const num = Number.parseInt(full, 16)
  if (Number.isNaN(num)) return hex
  const r = Math.max(0, Math.min(255, ((num >> 16) & 255) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amount))
  const b = Math.max(0, Math.min(255, (num & 255) + amount))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

function Hair({ style, color }: { style: number; color: string }) {
  switch (style) {
    case 1:
      return <circle cx="50" cy="26" r="21" fill={color} />
    case 2:
      return (
        <g fill={color}>
          <path d="M28 26 Q34 4 50 4 Q66 4 72 26 Q60 14 50 15 Q40 14 28 26Z" />
          <rect x="26" y="24" width="7" height="34" rx="3.5" />
          <rect x="67" y="24" width="7" height="34" rx="3.5" />
        </g>
      )
    case 3:
      return (
        <g fill={color}>
          <path d="M30 26 Q36 6 50 6 Q64 6 70 26 Q58 16 50 17 Q42 16 30 26Z" />
          <circle cx="50" cy="4" r="9" />
        </g>
      )
    case 4:
      return (
        <g fill={color}>
          <path d="M31 26 Q36 7 50 7 Q64 7 69 26 Q57 17 50 18 Q43 17 31 26Z" />
          <path d="M38 36 Q50 50 62 36 Q60 44 50 46 Q40 44 38 36Z" />
        </g>
      )
    case 5:
      return (
        <g>
          <path d="M27 24 Q30 2 50 2 Q70 2 73 24 Q50 16 27 24Z" fill={color} />
          <path d="M30 26 Q36 10 50 10 Q64 10 70 26 Q50 20 30 26Z" fill={shade(color, 24)} />
        </g>
      )
    default:
      return <path d="M31 27 Q35 8 50 8 Q65 8 69 27 Q58 18 50 19 Q42 18 31 27Z" fill={color} />
  }
}

/** A single flat-vector student, drawn in a 100x160 box. */
export function AvatarBody({ look, sitting = false }: { look: AvatarLook; sitting?: boolean }) {
  const { gender, skinTone, hairStyle, hairColor, outfitPrimary, outfitSecondary } = look
  const skinShade = shade(skinTone, -26)
  const sits = sitting ? 10 : 0

  return (
    <g transform={`translate(0 ${sits})`}>
      {gender === 'girl' ? (
        <>
          <path d="M18 100 L82 100 L74 126 L26 126 Z" fill={outfitSecondary} />
          <rect x="32" y="124" width="13" height="26" rx="6" fill={skinTone} />
          <rect x="55" y="124" width="13" height="26" rx="6" fill={skinTone} />
          <rect x="28" y="146" width="21" height="10" rx="5" fill="#1f2937" />
          <rect x="51" y="146" width="21" height="10" rx="5" fill="#1f2937" />
        </>
      ) : (
        <>
          <rect x="31" y="100" width="16" height="48" rx="7" fill={outfitSecondary} />
          <rect x="53" y="100" width="16" height="48" rx="7" fill={outfitSecondary} />
          <rect x="27" y="144" width="22" height="11" rx="5.5" fill="#1f2937" />
          <rect x="51" y="144" width="22" height="11" rx="5.5" fill="#1f2937" />
        </>
      )}

      <rect x="14" y={62 - sits} width="15" height="44" rx="7.5" fill={outfitPrimary} />
      <rect x="71" y={62 - sits} width="15" height="44" rx="7.5" fill={outfitPrimary} />
      <circle cx="21.5" cy={106 - sits} r="7" fill={skinTone} />
      <circle cx="78.5" cy={106 - sits} r="7" fill={skinTone} />

      <path d="M21 58 Q50 46 79 58 L84 104 Q50 114 16 104 Z" fill={outfitPrimary} />
      <path d="M38 52 Q50 64 62 52 L57 48 Q50 55 43 48 Z" fill={outfitSecondary} />

      <rect x="44" y="38" width="12" height="16" rx="6" fill={skinShade} />
      <ellipse cx="50" cy="30" rx="16.5" ry="18" fill={skinTone} />
      <circle cx="33.5" cy="32" r="3.4" fill={skinTone} />
      <circle cx="66.5" cy="32" r="3.4" fill={skinTone} />

      <circle cx="44" cy="30" r="1.8" fill="#1f2937" />
      <circle cx="56" cy="30" r="1.8" fill="#1f2937" />
      <path d="M44.5 37.5 Q50 41.5 55.5 37.5" stroke="#374151" strokeWidth="1.6" fill="none" strokeLinecap="round" />

      <Hair style={hairStyle} color={hairColor} />
    </g>
  )
}

/** Avatar placed inside a scene, positioned and scaled by the caller. */
export function SceneAvatar({
  look,
  x,
  y,
  scale = 1,
  sitting = false,
}: {
  look: AvatarLook
  x: number
  y: number
  scale?: number
  sitting?: boolean
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="50" cy="158" rx="26" ry="6" fill="rgba(15,23,42,0.25)" />
      <AvatarBody look={look} sitting={sitting} />
    </g>
  )
}

/** Square portrait used in the HUD, panels and the character creator. */
export function AvatarPortrait({
  look,
  size = 64,
  ring,
}: {
  look: AvatarLook
  size?: number
  ring?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="rounded-2xl"
      style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}
    >
      <defs>
        <linearGradient id="portrait-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#312e81" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#portrait-bg)" />
      <circle cx="50" cy="112" r="48" fill={look.outfitPrimary} />
      <g transform="translate(-22.5 -6) scale(1.45)">
        <AvatarBody look={look} />
      </g>
    </svg>
  )
}
