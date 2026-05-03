import { motion } from 'framer-motion'
import type { Stage } from '../lib/character'

interface Props {
  stage: Stage
  size?: number
  bobbing?: boolean
}

export function Character({ stage, size = 120, bobbing = true }: Props) {
  return (
    <motion.div
      style={{ width: size, height: size }}
      animate={bobbing ? { y: [0, -4, 0] } : undefined}
      transition={bobbing ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className="select-none"
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <defs>
          <radialGradient id="bodyG" cx="0.4" cy="0.4">
            <stop offset="0" stopColor="#fff8e7"/>
            <stop offset="1" stopColor="#f3e3b8"/>
          </radialGradient>
          <linearGradient id="mintG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6ee7b7"/>
            <stop offset="1" stopColor="#10b981"/>
          </linearGradient>
          <linearGradient id="coralG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fda4af"/>
            <stop offset="1" stopColor="#f43f5e"/>
          </linearGradient>
          <radialGradient id="auraG" cx="0.5" cy="0.5">
            <stop offset="0" stopColor="#fbbf24" stopOpacity="0.5"/>
            <stop offset="1" stopColor="#fbbf24" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {stage === 'master' && <circle cx="100" cy="105" r="95" fill="url(#auraG)"/>}

        {/* shadow */}
        <ellipse cx="100" cy="178" rx="46" ry="6" fill="#3d2f23" opacity="0.18"/>

        {stage === 'egg' && <Egg />}
        {stage === 'chick' && <Chick />}
        {stage === 'novice' && <Novice />}
        {stage === 'sage' && <Sage />}
        {stage === 'master' && <Master />}
      </svg>
    </motion.div>
  )
}

function Eyes({ y = 95, sparkle = false }: { y?: number; sparkle?: boolean }) {
  return (
    <g>
      <circle cx="82" cy={y} r="6" fill="#3d2f23"/>
      <circle cx="118" cy={y} r="6" fill="#3d2f23"/>
      {sparkle && (
        <>
          <circle cx="84" cy={y - 2} r="2" fill="#fff"/>
          <circle cx="120" cy={y - 2} r="2" fill="#fff"/>
        </>
      )}
    </g>
  )
}

function Smile({ y = 115, w = 14 }: { y?: number; w?: number }) {
  return (
    <path
      d={`M ${100 - w} ${y} Q 100 ${y + 8} ${100 + w} ${y}`}
      stroke="#3d2f23"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  )
}

function Cheek() {
  return (
    <g opacity="0.6">
      <ellipse cx="72" cy="108" rx="6" ry="4" fill="#fb7185"/>
      <ellipse cx="128" cy="108" rx="6" ry="4" fill="#fb7185"/>
    </g>
  )
}

function Egg() {
  return (
    <g>
      <ellipse cx="100" cy="110" rx="50" ry="60" fill="url(#bodyG)" stroke="#dccdb0" strokeWidth="2"/>
      <path d="M 70 90 L 80 100 L 70 110 L 80 120" stroke="#c9b896" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
      <path d="M 130 95 L 122 105 L 130 115" stroke="#c9b896" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      {/* dots */}
      <circle cx="92" cy="80" r="2" fill="#d4c5a8"/>
      <circle cx="115" cy="135" r="1.6" fill="#d4c5a8"/>
      <circle cx="78" cy="140" r="1.6" fill="#d4c5a8"/>
    </g>
  )
}

function Chick() {
  return (
    <g>
      {/* cracked egg shell bottom */}
      <path d="M 55 130 Q 60 165 100 168 Q 140 165 145 130 Z" fill="#fff8e7" stroke="#dccdb0" strokeWidth="2"/>
      <path d="M 60 132 L 70 124 L 80 132 L 90 122 L 100 132 L 110 122 L 120 132 L 130 124 L 140 132"
        stroke="#dccdb0" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      {/* mini pill body */}
      <g transform="translate(100 100)">
        <ellipse cx="0" cy="0" rx="38" ry="32" fill="url(#mintG)"/>
        <ellipse cx="-19" cy="0" rx="19" ry="32" fill="url(#coralG)"/>
        <line x1="0" y1="-32" x2="0" y2="32" stroke="#3d2f23" strokeWidth="1.4" opacity="0.5"/>
      </g>
      <Eyes y={92} sparkle/>
      <Smile y={110} w={10}/>
      <Cheek/>
    </g>
  )
}

function Novice() {
  return (
    <g>
      {/* pill body bigger */}
      <g transform="translate(100 110)">
        <ellipse cx="0" cy="0" rx="56" ry="46" fill="url(#mintG)"/>
        <ellipse cx="-28" cy="0" rx="28" ry="46" fill="url(#coralG)"/>
        <line x1="0" y1="-46" x2="0" y2="46" stroke="#3d2f23" strokeWidth="1.6" opacity="0.5"/>
      </g>
      <Eyes y={100} sparkle/>
      <Smile y={120} w={14}/>
      <Cheek/>
      {/* tiny arms */}
      <path d="M 38 120 Q 30 125 28 138" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <path d="M 162 120 Q 170 125 172 138" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    </g>
  )
}

function Sage() {
  return (
    <g>
      <g transform="translate(100 115)">
        <ellipse cx="0" cy="0" rx="58" ry="48" fill="url(#mintG)"/>
        <ellipse cx="-29" cy="0" rx="29" ry="48" fill="url(#coralG)"/>
        <line x1="0" y1="-48" x2="0" y2="48" stroke="#3d2f23" strokeWidth="1.6" opacity="0.5"/>
      </g>
      <Eyes y={104} sparkle/>
      <Smile y={124} w={14}/>
      <Cheek/>
      {/* glasses */}
      <g fill="none" stroke="#3d2f23" strokeWidth="2.4">
        <circle cx="82" cy="104" r="11"/>
        <circle cx="118" cy="104" r="11"/>
        <line x1="93" y1="104" x2="107" y2="104"/>
      </g>
      <path d="M 38 125 Q 30 130 28 142" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <path d="M 162 125 Q 170 130 172 142" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
    </g>
  )
}

function Master() {
  return (
    <g>
      <g transform="translate(100 118)">
        <ellipse cx="0" cy="0" rx="60" ry="50" fill="url(#mintG)"/>
        <ellipse cx="-30" cy="0" rx="30" ry="50" fill="url(#coralG)"/>
        <line x1="0" y1="-50" x2="0" y2="50" stroke="#3d2f23" strokeWidth="1.6" opacity="0.5"/>
      </g>
      <Eyes y={108} sparkle/>
      <Smile y={128} w={16}/>
      <Cheek/>
      {/* crown */}
      <path d="M 70 60 L 80 78 L 100 56 L 120 78 L 130 60 L 130 84 L 70 84 Z"
        fill="#fbbf24" stroke="#3d2f23" strokeWidth="2" strokeLinejoin="round"/>
      <circle cx="80" cy="68" r="3.5" fill="#f43f5e" stroke="#3d2f23" strokeWidth="1.2"/>
      <circle cx="100" cy="62" r="3.5" fill="#10b981" stroke="#3d2f23" strokeWidth="1.2"/>
      <circle cx="120" cy="68" r="3.5" fill="#60a5fa" stroke="#3d2f23" strokeWidth="1.2"/>
      {/* arms with stars */}
      <path d="M 38 130 Q 26 132 22 144" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <path d="M 162 130 Q 174 132 178 144" stroke="#3d2f23" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
      <text x="20" y="60" fontSize="14" fill="#fbbf24">✦</text>
      <text x="170" y="80" fontSize="12" fill="#fbbf24">✦</text>
      <text x="180" y="170" fontSize="10" fill="#fbbf24">✦</text>
    </g>
  )
}
