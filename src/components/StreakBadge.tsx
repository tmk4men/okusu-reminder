import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import type { StreakInfo } from '../lib/streak'

export function StreakBadge({ streak }: { streak: StreakInfo }) {
  if (streak.current === 0 && streak.best === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 rounded-full border border-coral-300/40 bg-coral-300/15 px-3 py-1.5"
    >
      <Flame size={14} className="text-coral-500" fill="currentColor" />
      {streak.current > 0 ? (
        <span className="text-xs font-medium tracking-wide text-ink-50">
          <span className="tabular-nums">{streak.current}</span>日連続
          {streak.best > streak.current && (
            <span className="ml-1.5 text-ink-300">/ ベスト {streak.best}</span>
          )}
        </span>
      ) : (
        <span className="text-xs text-ink-300">ベスト {streak.best}日</span>
      )}
    </motion.div>
  )
}
