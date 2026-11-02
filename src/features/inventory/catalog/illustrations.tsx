import type { ReactNode } from 'react'

/*
  Hand-drawn SVG illustrations for the built-in prop catalog.
  Style: matte black tile, ivory and gold, a few accent colors. viewBox 120 × 90.
*/

const C = {
  ivory: '#ECECEA',
  edge: '#CFCFC9',
  gold: '#C9A24D',
  goldDark: '#9C7A30',
  red: '#B3363A',
  redDark: '#7E2427',
  blue: '#2E5AA8',
  blueDark: '#1F3F78',
  ink: '#111113',
  silver: '#C7CBD1',
  silverDark: '#8E949C',
  copper: '#C07A3E',
  copperDark: '#8A5328',
  felt: '#1F5D45',
  paper: '#F4EFE3',
  skin: '#D9A27F',
  skinDark: '#B07D5B',
  leather: '#6B4226',
  leatherDark: '#4A2D19',
}

type CardProps = { x: number; y: number; w?: number; h?: number; rotate?: number; origin?: [number, number] }

function rot(rotate = 0, origin: [number, number]) {
  return rotate ? `rotate(${rotate} ${origin[0]} ${origin[1]})` : undefined
}

function CardBack({ x, y, w = 34, h = 48, rotate, origin, color, dark }: CardProps & { color: string; dark: string }) {
  const o = origin ?? [x + w / 2, y + h / 2]
  const cx = x + w / 2
  const cy = y + h / 2
  return (
    <g transform={rot(rotate, o)}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.ivory} />
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h - 5} rx={1.5} fill={color} />
      <rect x={x + 4.5} y={y + 4.5} width={w - 9} height={h - 9} rx={1} fill="none" stroke={C.ivory} strokeOpacity={0.55} strokeWidth={0.8} />
      <path
        d={`M${x + 4.5} ${y + 4.5} L${x + w - 4.5} ${y + h - 4.5} M${x + w - 4.5} ${y + 4.5} L${x + 4.5} ${y + h - 4.5}`}
        stroke={dark}
        strokeWidth={0.8}
        opacity={0.6}
      />
      <path d={`M${cx} ${cy - 7} L${cx + 5} ${cy} L${cx} ${cy + 7} L${cx - 5} ${cy} Z`} fill={C.ivory} opacity={0.9} />
      <circle cx={cx} cy={cy} r={1.6} fill={color} />
    </g>
  )
}

function CardFace({
  x,
  y,
  w = 34,
  h = 48,
  rotate,
  origin,
  rank = 'A',
  suit = '♠',
  color = C.ink,
}: CardProps & { rank?: string; suit?: string; color?: string }) {
  const o = origin ?? [x + w / 2, y + h / 2]
  return (
    <g transform={rot(rotate, o)}>
      <rect x={x} y={y} width={w} height={h} rx={3} fill={C.ivory} stroke={C.edge} strokeWidth={0.6} />
      <text x={x + 3.5} y={y + 10} fontSize={w * 0.24} fontWeight={700} fill={color} fontFamily="Georgia, serif">
        {rank}
      </text>
      <text x={x + w / 2} y={y + h / 2 + w * 0.17} fontSize={w * 0.5} textAnchor="middle" fill={color} fontFamily="Georgia, serif">
        {suit}
      </text>
    </g>
  )
}

function Deck({ x, y, color, dark }: { x: number; y: number; color: string; dark: string }) {
  return (
    <g>
      {[6, 4, 2].map((d) => (
        <rect key={d} x={x + d} y={y + d} width={34} height={48} rx={3} fill={d === 6 ? C.edge : C.ivory} stroke={C.edge} strokeWidth={0.5} />
      ))}
      <CardBack x={x} y={y} color={color} dark={dark} />
    </g>
  )
}

function Coin({ cx, cy, r = 13, fill = C.silver, dark = C.silverDark }: { cx: number; cy: number; r?: number; fill?: string; dark?: string }) {
  return (
    <g>
      <circle cx={cx + 1.2} cy={cy + 1.6} r={r} fill={dark} />
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle cx={cx} cy={cy} r={r - 2.4} fill="none" stroke={dark} strokeWidth={1} strokeDasharray="1.2 1.4" />
      <circle cx={cx} cy={cy} r={r * 0.45} fill="none" stroke={dark} strokeWidth={1} opacity={0.6} />
      <path d={`M${cx - r * 0.6} ${cy - r * 0.45} A ${r * 0.8} ${r * 0.8} 0 0 1 ${cx + r * 0.1} ${cy - r * 0.75}`} stroke="#fff" strokeOpacity={0.5} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </g>
  )
}

function Sparkle({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <path
      transform={`translate(${x} ${y}) scale(${s})`}
      d="M0 -6 L1.4 -1.4 L6 0 L1.4 1.4 L0 6 L-1.4 1.4 L-6 0 L-1.4 -1.4 Z"
      fill={C.gold}
    />
  )
}

const fan = (angles: number[], render: (angle: number, i: number) => ReactNode) => angles.map((a, i) => render(a, i))

export const ILLUSTRATIONS: Record<string, ReactNode> = {
  /* ------------------------------------------------------------ Cards */
  'bicycle-red': <Deck x={40} y={18} color={C.red} dark={C.redDark} />,
  'bicycle-blue': <Deck x={40} y={18} color={C.blue} dark={C.blueDark} />,
  'double-backer': (
    <>
      <CardBack x={34} y={20} rotate={-12} color={C.red} dark={C.redDark} />
      <CardBack x={52} y={20} rotate={12} color={C.blue} dark={C.blueDark} />
    </>
  ),
  'blank-face-deck': (
    <>
      {[6, 4, 2].map((d) => (
        <rect key={d} x={43 + d} y={18 + d} width={34} height={48} rx={3} fill={C.edge} />
      ))}
      <rect x={43} y={18} width={34} height={48} rx={3} fill={C.ivory} />
      <rect x={47} y={22} width={26} height={40} rx={2} fill="none" stroke={C.silverDark} strokeDasharray="2 2" strokeWidth={0.8} />
    </>
  ),
  'svengali-deck': (
    <>
      {fan([-30, -10, 10, 30], (a, i) => (
        <CardFace key={i} x={43} y={16} rotate={a} origin={[60, 72]} rank="A" suit="♦" color={C.red} />
      ))}
    </>
  ),
  'stripper-deck': (
    <>
      {[5, 3].map((d) => (
        <path key={d} d={`M${44 + d} ${18 + d} L${78 + d} ${18 + d} L${75 + d} ${66 + d} L${47 + d} ${66 + d} Z`} fill={C.edge} />
      ))}
      <path d="M44 18 L78 18 L75 66 L47 66 Z" fill={C.ivory} />
      <path d="M47 21 L75 21 L72.6 63 L49.4 63 Z" fill={C.red} />
      <path d="M61 33 L66 42 L61 51 L56 42 Z" fill={C.ivory} opacity={0.9} />
      <path d="M86 28 L92 28 M86 56 L92 56" stroke={C.gold} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M89 28 L89 56" stroke={C.gold} strokeWidth={1} strokeDasharray="2 2" />
    </>
  ),
  'invisible-deck': (
    <>
      <rect x={46} y={24} width={34} height={48} rx={3} fill="none" stroke={C.ivory} strokeOpacity={0.35} strokeDasharray="3 2" />
      <rect x={42} y={20} width={34} height={48} rx={3} fill="none" stroke={C.ivory} strokeOpacity={0.6} strokeDasharray="3 2" />
      <path d="M50 30 L68 30 M50 36 L64 36" stroke={C.ivory} strokeOpacity={0.3} strokeWidth={1.2} strokeLinecap="round" />
      <Sparkle x={84} y={22} />
      <Sparkle x={36} y={62} s={0.7} />
    </>
  ),
  'jumbo-cards': (
    <>
      <CardFace x={34} y={10} w={48} h={70} rotate={-6} rank="A" suit="♠" />
      <CardFace x={80} y={44} w={18} h={26} rotate={8} rank="A" suit="♠" />
    </>
  ),

  /* ------------------------------------------------------------ Coins */
  'half-dollars': (
    <>
      <Coin cx={44} cy={52} r={15} />
      <Coin cx={62} cy={40} r={15} />
      <Coin cx={80} cy={54} r={15} />
    </>
  ),
  'expanded-shell': (
    <>
      <Coin cx={50} cy={46} r={15} />
      <circle cx={72} cy={46} r={18} fill="none" stroke={C.silverDark} strokeWidth={4.5} />
      <circle cx={72} cy={46} r={18} fill="none" stroke={C.silver} strokeWidth={3} />
      <path d="M58 32 A 18 18 0 0 1 70 28" stroke="#fff" strokeOpacity={0.5} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </>
  ),
  'copper-silver': (
    <>
      <Coin cx={48} cy={46} r={17} fill={C.copper} dark={C.copperDark} />
      <Coin cx={74} cy={46} r={17} />
      <path d="M58 70 L64 70" stroke={C.gold} strokeWidth={1.5} strokeLinecap="round" />
    </>
  ),

  /* --------------------------------------------------------- Close-up */
  'sponge-balls': (
    <>
      {[
        [42, 40],
        [62, 34],
        [78, 50],
        [55, 58],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx + 1} cy={cy + 2} r={11} fill={C.redDark} />
          <circle cx={cx} cy={cy} r={11} fill={C.red} />
          {[
            [-4, -3],
            [3, -5],
            [5, 2],
            [-2, 4],
            [0, 0],
          ].map(([dx, dy], j) => (
            <circle key={j} cx={cx + dx} cy={cy + dy} r={0.9} fill={C.redDark} />
          ))}
          <path d={`M${cx - 6} ${cy - 4} A 7 7 0 0 1 ${cx - 1} ${cy - 8}`} stroke="#fff" strokeOpacity={0.35} strokeWidth={1.4} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </>
  ),
  'cups-and-balls': (
    <>
      {[30, 60, 90].map((cx, i) => (
        <g key={i}>
          <path d={`M${cx - 10} ${24} L${cx + 10} ${24} L${cx + 13} ${62} L${cx - 13} ${62} Z`} fill={C.gold} />
          <path d={`M${cx - 10} ${24} L${cx - 6} ${24} L${cx - 8} ${62} L${cx - 13} ${62} Z`} fill="#fff" opacity={0.18} />
          <rect x={cx - 14} y={60} width={28} height={4} rx={1.5} fill={C.goldDark} />
          <rect x={cx - 11} y={22} width={22} height={3} rx={1.5} fill={C.goldDark} />
        </g>
      ))}
      <circle cx={45} cy={72} r={4} fill={C.red} />
      <circle cx={75} cy={72} r={4} fill={C.red} />
    </>
  ),
  'thumb-tip': (
    <>
      <path d="M46 72 L46 34 C46 20 74 20 74 34 L74 72 Z" fill={C.skin} />
      <path d="M50 34 C50 26 70 26 70 34 L70 44 C70 47 50 47 50 44 Z" fill={C.ivory} opacity={0.75} />
      <path d="M46 72 L74 72" stroke={C.skinDark} strokeWidth={3} />
      <path d="M52 52 C56 55 64 55 68 52 M52 60 C56 63 64 63 68 60" stroke={C.skinDark} strokeWidth={1} fill="none" opacity={0.7} />
      <Sparkle x={86} y={28} s={0.8} />
    </>
  ),
  'close-up-pad': (
    <>
      <rect x={18} y={20} width={84} height={54} rx={8} fill={C.felt} />
      <rect x={22} y={24} width={76} height={46} rx={6} fill="none" stroke={C.gold} strokeOpacity={0.6} strokeDasharray="2.5 2" />
      <CardFace x={50} y={30} w={20} h={28} rotate={-8} rank="K" suit="♥" color={C.red} />
    </>
  ),
  'peek-wallet': (
    <>
      <rect x={28} y={24} width={64} height={44} rx={5} fill={C.leather} />
      <path d="M28 40 L92 40" stroke={C.leatherDark} strokeWidth={2} />
      <rect x={32} y={28} width={56} height={36} rx={3} fill="none" stroke={C.gold} strokeOpacity={0.55} strokeDasharray="2 2" />
      <rect x={66} y={46} width={16} height={10} rx={1.5} fill={C.ink} opacity={0.5} />
    </>
  ),
  'rubber-bands': (
    <>
      <ellipse cx={50} cy={46} rx={22} ry={13} fill="none" stroke="#C9A27A" strokeWidth={3} transform="rotate(-15 50 46)" />
      <ellipse cx={70} cy={48} rx={20} ry={11} fill="none" stroke={C.red} strokeWidth={3} transform="rotate(20 70 48)" />
      <ellipse cx={60} cy={56} rx={18} ry={9} fill="none" stroke={C.blue} strokeWidth={3} />
    </>
  ),

  /* -------------------------------------------------------- Mentalism */
  'nail-writer': (
    <>
      <rect x={60} y={22} width={32} height={46} rx={3} fill={C.ivory} transform="rotate(8 76 45)" />
      <path d="M66 36 C70 32 74 40 78 35 S84 38 87 34 M66 46 C70 43 73 49 77 45" stroke={C.blue} strokeWidth={1.3} fill="none" transform="rotate(8 76 45)" />
      <path d="M28 76 L28 42 C28 30 50 30 50 42 L50 76 Z" fill={C.skin} />
      <path d="M32 42 C32 35 46 35 46 42 L46 50 C46 52 32 52 32 50 Z" fill={C.ivory} opacity={0.7} />
      <path d="M31 38 C31 33 47 33 47 38 L47 42 L31 42 Z" fill={C.silver} />
      <path d="M39 33.5 L39 29.5" stroke={C.ink} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M32 60 C36 63 42 63 46 60" stroke={C.skinDark} strokeWidth={1} fill="none" opacity={0.7} />
    </>
  ),
  billets: (
    <>
      {[
        [30, 30, -12],
        [56, 22, 6],
        [78, 36, -4],
        [44, 52, 10],
        [70, 58, -14],
      ].map(([x, y, a], i) => (
        <g key={i} transform={`rotate(${a} ${x + 9} ${y + 9})`}>
          <rect x={x} y={y} width={18} height={18} rx={1} fill={C.paper} />
          <path d={`M${x} ${y + 9} L${x + 18} ${y + 9} M${x + 9} ${y} L${x + 9} ${y + 18}`} stroke={C.edge} strokeWidth={0.8} />
        </g>
      ))}
    </>
  ),
  'impression-pad': (
    <>
      <rect x={38} y={22} width={46} height={56} rx={3} fill={C.edge} />
      <rect x={36} y={20} width={46} height={56} rx={3} fill={C.paper} />
      {[44, 52, 60, 68, 76].map((x) => (
        <circle key={x} cx={x} cy={20} r={2.2} fill="none" stroke={C.gold} strokeWidth={1.4} />
      ))}
      {[32, 40, 48, 56].map((y) => (
        <path key={y} d={`M42 ${y} L76 ${y}`} stroke={C.silver} strokeWidth={0.8} />
      ))}
      <path d="M44 62 C50 56 56 66 62 60 S70 62 74 58" stroke={C.blue} strokeWidth={1.4} fill="none" />
    </>
  ),

  /* ------------------------------------------------------------ Stage */
  silks: (
    <>
      <path d="M22 30 C40 22 52 34 62 26 L68 62 C56 70 44 58 28 66 Z" fill={C.red} />
      <path d="M44 22 C60 16 72 28 84 20 L92 54 C80 62 68 50 52 58 Z" fill={C.gold} opacity={0.95} />
      <path d="M58 40 C74 34 84 46 98 38 L102 72 C88 78 78 66 64 74 Z" fill={C.blue} opacity={0.95} />
    </>
  ),
  'linking-rings': (
    <>
      {[
        [44, 40],
        [62, 52],
        [80, 40],
      ].map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={16} fill="none" stroke={C.silverDark} strokeWidth={4.5} />
          <circle cx={cx} cy={cy} r={16} fill="none" stroke={C.silver} strokeWidth={2.6} />
        </g>
      ))}
    </>
  ),
  rope: (
    <>
      <path d="M20 62 C34 30 50 70 62 44 S88 24 100 40" stroke={C.edge} strokeWidth={7} fill="none" strokeLinecap="round" />
      <path d="M20 62 C34 30 50 70 62 44 S88 24 100 40" stroke={C.ivory} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d="M20 62 C34 30 50 70 62 44 S88 24 100 40" stroke={C.silver} strokeWidth={1} strokeDasharray="2 3" fill="none" />
      <path d="M100 40 L106 36 M100 40 L107 41 M20 62 L14 66 M20 62 L13 61" stroke={C.ivory} strokeWidth={1.2} strokeLinecap="round" />
    </>
  ),
  'magic-wand': (
    <>
      <g transform="rotate(-30 60 48)">
        <rect x={22} y={44} width={76} height={8} rx={2} fill={C.ink} stroke="#2c2c2f" />
        <rect x={22} y={44} width={12} height={8} rx={2} fill={C.ivory} />
        <rect x={86} y={44} width={12} height={8} rx={2} fill={C.ivory} />
      </g>
      <Sparkle x={94} y={20} s={1.2} />
      <Sparkle x={104} y={34} s={0.6} />
    </>
  ),
  'change-bag': (
    <>
      <path d="M14 30 L44 30" stroke={C.gold} strokeWidth={3} strokeLinecap="round" />
      <path d="M44 22 L96 22 C96 22 100 48 86 66 C78 76 62 76 54 66 C40 48 44 22 44 22 Z" fill={C.red} />
      <path d="M44 22 L96 22" stroke={C.gold} strokeWidth={4} strokeLinecap="round" />
      <path d="M52 30 C54 46 58 58 64 66" stroke={C.redDark} strokeWidth={1.5} fill="none" />
      <Sparkle x={100} y={58} s={0.7} />
    </>
  ),

  /* ------------------------------------------------------ Consumables */
  sharpie: (
    <g transform="rotate(-25 60 45)">
      <rect x={22} y={38} width={56} height={14} rx={3} fill={C.ink} stroke="#2c2c2f" />
      <rect x={34} y={38} width={26} height={14} fill={C.ivory} />
      <path d="M38 45 L56 45" stroke={C.gold} strokeWidth={2} strokeLinecap="round" />
      <rect x={76} y={37} width={24} height={16} rx={3} fill={C.ink} stroke="#2c2c2f" />
      <rect x={80} y={34} width={16} height={4} rx={1.5} fill={C.silverDark} />
      <path d="M22 41 L14 45 L22 49 Z" fill={C.ink} />
    </g>
  ),
  'flash-paper': (
    <>
      <rect x={30} y={30} width={44} height={50} rx={1} fill={C.paper} transform="rotate(-6 52 55)" />
      <path d="M78 64 C64 60 66 44 74 36 C74 46 80 46 82 38 C88 46 96 52 90 62 C88 66 84 66 78 64 Z" fill="#E8762B" />
      <path d="M80 62 C74 58 76 50 80 46 C81 52 84 52 85 48 C88 54 88 60 80 62 Z" fill={C.gold} />
    </>
  ),
}

export function CatalogIllustration({ catalogKey, className }: { catalogKey: string | null | undefined; className?: string }) {
  const art = catalogKey ? ILLUSTRATIONS[catalogKey] : undefined
  if (!art) return null
  return (
    <svg viewBox="0 0 120 90" className={className} role="img" aria-hidden="true">
      <defs>
        <radialGradient id="mh-tile-glow" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#2a2618" />
          <stop offset="100%" stopColor="#141415" />
        </radialGradient>
      </defs>
      <rect width="120" height="90" fill="url(#mh-tile-glow)" />
      {art}
    </svg>
  )
}
