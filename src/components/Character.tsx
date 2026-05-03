import { motion } from 'framer-motion'
import type { Stage } from '../lib/character'

const IMG: Record<Stage, string> = {
  egg: '/character/lv0-egg.png',
  hatched: '/character/lv1-hatched.png',
  toddler: '/character/lv2-toddler.png',
  child: '/character/lv3-child.png',
  adult: '/character/lv4-adult.png',
  master: '/character/lv5-master.png',
}

interface Props {
  stage: Stage
  size?: number
  bobbing?: boolean
  className?: string
}

export function Character({ stage, size = 120, bobbing = true, className = '' }: Props) {
  return (
    <motion.img
      src={IMG[stage]}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      animate={bobbing ? { y: [0, -4, 0] } : undefined}
      transition={
        bobbing ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined
      }
      draggable={false}
      className={`select-none ${className}`}
    />
  )
}
