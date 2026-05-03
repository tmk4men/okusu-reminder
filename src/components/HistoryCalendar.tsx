import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, ChevronRight } from 'lucide-react'
import { recentDailyCounts, type DayLoad } from '../lib/streak'
import { todayKey } from '../lib/date'

function intensityClass(count: number, max: number): string {
  if (count === 0) return 'bg-ink-700/40'
  if (max <= 1) return 'bg-mint-400'
  const ratio = count / max
  if (ratio >= 0.85) return 'bg-mint-500'
  if (ratio >= 0.55) return 'bg-mint-400'
  if (ratio >= 0.3) return 'bg-mint-300'
  return 'bg-mint-300/60'
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return String(d.getDate())
}

function isToday(dateStr: string): boolean {
  return dateStr === todayKey()
}

interface Props {
  refreshKey?: unknown
}

export function MiniCalendar({ refreshKey }: Props) {
  const [days, setDays] = useState<DayLoad[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    recentDailyCounts(14).then(setDays)
  }, [refreshKey])

  const max = useMemo(() => Math.max(1, ...days.map((d) => d.count)), [days])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left active:scale-[0.99]"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-widest text-ink-400">
            あしあと
          </h3>
          <span className="inline-flex items-center text-xs text-ink-300">
            くわしく <ChevronRight size={14} />
          </span>
        </div>
        <div className="flex items-end justify-between gap-1">
          {days.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`h-7 w-full rounded-md transition-colors ${intensityClass(
                  d.count,
                  max,
                )} ${isToday(d.date) ? 'ring-2 ring-coral-400 ring-offset-2 ring-offset-ink-800' : ''}`}
              />
              <span className="text-[10px] tabular-nums text-ink-400">
                {shortDay(d.date)}
              </span>
            </div>
          ))}
        </div>
      </button>

      <AnimatePresence>{open && <HistoryModal onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  )
}

function HistoryModal({ onClose }: { onClose: () => void }) {
  const [days, setDays] = useState<DayLoad[]>([])
  useEffect(() => {
    recentDailyCounts(42).then(setDays)
  }, [])

  const max = useMemo(() => Math.max(1, ...days.map((d) => d.count)), [days])
  const totalDays = days.filter((d) => d.count > 0).length
  const totalCount = days.reduce((s, d) => s + d.count, 0)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[80svh] max-w-md overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-800 pb-[calc(env(safe-area-inset-bottom)+96px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-800/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={22} />
          </button>
          <h2 className="text-base font-medium text-ink-50">あしあと（直近6週間）</h2>
          <span className="w-6" />
        </div>

        <div className="space-y-6 px-5 py-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
              <p className="text-xs text-ink-400">のんだ日数</p>
              <p className="mt-1 text-2xl font-semibold text-ink-50">
                {totalDays}<span className="ml-1 text-sm text-ink-300">/ 42日</span>
              </p>
            </div>
            <div className="rounded-2xl border border-ink-700 bg-ink-900 p-4">
              <p className="text-xs text-ink-400">のんだ回数</p>
              <p className="mt-1 text-2xl font-semibold text-ink-50">
                {totalCount}<span className="ml-1 text-sm text-ink-300">回</span>
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-[10px] text-ink-400">
              {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((d) => (
                <div
                  key={d.date}
                  className={`relative aspect-square rounded-md ${intensityClass(d.count, max)} ${
                    isToday(d.date) ? 'ring-2 ring-coral-400' : ''
                  }`}
                  title={`${d.date}: ${d.count}回`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-ink-50/70">
                    {shortDay(d.date)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-[11px] text-ink-400">
            <span>少</span>
            <span className="h-3 w-3 rounded bg-ink-700/40" />
            <span className="h-3 w-3 rounded bg-mint-300/60" />
            <span className="h-3 w-3 rounded bg-mint-300" />
            <span className="h-3 w-3 rounded bg-mint-400" />
            <span className="h-3 w-3 rounded bg-mint-500" />
            <span>多</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
