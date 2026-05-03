import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Flame, Sparkles, Calendar } from 'lucide-react'
import { characterFromTotal, type CharacterState } from '../lib/character'
import { gatherStats, BADGES, type BadgeStats } from '../lib/badges'
import { Character } from './Character'
import { BadgeGrid } from './BadgeGrid'

interface Props {
  onClose: () => void
}

export function JourneyModal({ onClose }: Props) {
  const [stats, setStats] = useState<BadgeStats | null>(null)
  const [chr, setChr] = useState<CharacterState | null>(null)

  useEffect(() => {
    gatherStats().then((s) => {
      setStats(s)
      setChr(characterFromTotal(s.total))
    })
  }, [])

  const earnedCount = stats ? BADGES.filter((b) => b.check(stats)).length : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[92svh] max-w-md overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-800 pb-[calc(env(safe-area-inset-bottom)+24px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-800/95 px-5 py-3 backdrop-blur">
          <span className="w-6" />
          <h2 className="text-base font-medium text-ink-50">あなたのあゆみ</h2>
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 pt-6">
          {chr && (
            <div className="mb-6 rounded-3xl bg-gradient-to-b from-ink-700/40 to-ink-800 p-6 text-center">
              <div className="flex justify-center">
                <Character stage={chr.stage.stage} size={140} />
              </div>
              <p className="mt-3 text-lg font-semibold text-ink-50">{chr.stage.name}</p>
              <p className="mt-1 text-xs text-ink-300">{chr.stage.message}</p>

              {chr.nextStage && (
                <div className="mx-auto mt-5 max-w-[260px]">
                  <div className="mb-1.5 flex items-center justify-between text-[11px] text-ink-400">
                    <span>次：{chr.nextStage.name}</span>
                    <span className="tabular-nums">あと {chr.toNext}回</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-ink-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${chr.progressPct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      className="h-full rounded-full bg-gradient-to-r from-mint-300 to-mint-500"
                    />
                  </div>
                </div>
              )}
              {!chr.nextStage && (
                <p className="mt-3 text-[11px] text-ink-300">最終形態に到達 ✨</p>
              )}
            </div>
          )}

          {stats && (
            <div className="mb-6 grid grid-cols-3 gap-2">
              <Stat label="累計" value={stats.total} unit="回" Icon={Sparkles} />
              <Stat label="連続" value={stats.currentStreak} unit="日" Icon={Flame} accent="text-coral-500" />
              <Stat label="記録日" value={stats.uniqueDays} unit="日" Icon={Calendar} />
            </div>
          )}

          {stats && (
            <div className="mb-2">
              <BadgeGrid stats={stats} />
            </div>
          )}

          <p className="mt-6 text-center text-[11px] text-ink-400">
            {earnedCount === BADGES.length
              ? 'すべてのバッジを集めた！🎉'
              : 'のんで、のんちゃんと一緒に育っていこう'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Stat({
  label,
  value,
  unit,
  Icon,
  accent = 'text-mint-500',
}: {
  label: string
  value: number
  unit: string
  Icon: typeof Sparkles
  accent?: string
}) {
  return (
    <div className="rounded-2xl border border-ink-700 bg-ink-900 p-3 text-center">
      <Icon size={16} className={`mx-auto ${accent}`} />
      <p className="mt-1 text-[10px] text-ink-400">{label}</p>
      <p className="mt-0.5 text-xl font-semibold text-ink-50 tabular-nums">
        {value}
        <span className="ml-0.5 text-xs text-ink-300">{unit}</span>
      </p>
    </div>
  )
}
