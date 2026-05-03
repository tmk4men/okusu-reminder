import { motion } from 'framer-motion'
import { BADGES, type BadgeStats } from '../lib/badges'

interface Props {
  stats: BadgeStats
}

const RANK_BG: Record<string, string> = {
  bronze: 'from-amber-100 to-amber-300',
  silver: 'from-slate-100 to-slate-300',
  gold: 'from-yellow-100 to-yellow-300',
  special: 'from-fuchsia-200 via-pink-200 to-amber-200',
}

export function BadgeGrid({ stats }: Props) {
  const earned = BADGES.filter((b) => b.check(stats))
  const locked = BADGES.filter((b) => !b.check(stats))

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between px-1">
        <h3 className="text-xs font-medium uppercase tracking-widest text-ink-400">
          バッジ
        </h3>
        <span className="text-xs text-ink-300 tabular-nums">
          {earned.length} / {BADGES.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[...earned, ...locked].map((b, i) => {
          const got = b.check(stats)
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center ${
                got
                  ? 'border-ink-700 bg-ink-800'
                  : 'border-dashed border-ink-700 bg-ink-700/20'
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-2xl ${
                  got ? RANK_BG[b.rank] : 'from-ink-700 to-ink-700'
                } ${got ? '' : 'grayscale opacity-40'}`}
              >
                <span>{b.emoji}</span>
              </div>
              <p className={`text-[11px] font-medium leading-tight ${got ? 'text-ink-50' : 'text-ink-400'}`}>
                {b.name}
              </p>
              <p className="text-[9px] leading-tight text-ink-400">
                {b.description}
              </p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
