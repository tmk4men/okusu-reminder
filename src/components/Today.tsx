import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Undo2 } from 'lucide-react'
import { db } from '../db/schema'
import type { Medication, Schedule, DoseLog, MealTimes } from '../db/types'
import { DEFAULT_MEAL_TIMES } from '../db/types'
import { todayKey, todayWeekday, nowMinutes } from '../lib/date'
import { describeSchedule, isToday, scheduledMinutes, scheduledTimeStr } from '../lib/schedule'

interface Item {
  schedule: Schedule
  med: Medication
  scheduledMin: number
  timeStr: string
  log?: DoseLog
}

export function Today() {
  const allMeds = useLiveQuery(() => db.medications.toArray()) ?? []
  const meds = allMeds.filter((m) => !m.archived)
  const schedules = useLiveQuery(() => db.schedules.toArray()) ?? []
  const dateKey = todayKey()
  const logs = useLiveQuery(() => db.logs.where('date').equals(dateKey).toArray(), [dateKey]) ?? []
  const mealRow = useLiveQuery(() => db.settings.get('mealTimes'), [])
  const meals = ((mealRow?.value as MealTimes) ?? DEFAULT_MEAL_TIMES) as MealTimes

  const wd = todayWeekday()
  const medMap = useMemo(() => new Map(allMeds.map((m) => [m.id!, m])), [allMeds])
  const logMap = useMemo(() => new Map(logs.map((l) => [l.scheduleId, l])), [logs])

  const items: Item[] = useMemo(() => {
    const result: Item[] = []
    for (const s of schedules) {
      if (!isToday(s, wd)) continue
      const med = medMap.get(s.medicationId)
      if (!med || med.archived) continue
      result.push({
        schedule: s,
        med,
        scheduledMin: scheduledMinutes(s, meals),
        timeStr: scheduledTimeStr(s, meals),
        log: logMap.get(s.id!),
      })
    }
    return result.sort((a, b) => a.scheduledMin - b.scheduledMin)
  }, [schedules, medMap, logMap, meals, wd])

  const pending = items.filter((i) => !i.log)
  const done = items.filter((i) => i.log)
  const now = nowMinutes()

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return 'こんばんは'
    if (h < 11) return 'おはようございます'
    if (h < 17) return 'こんにちは'
    return 'こんばんは'
  }, [])

  async function take(i: Item) {
    await db.logs.add({
      scheduleId: i.schedule.id!,
      date: dateKey,
      status: 'taken',
      recordedAt: Date.now(),
    })
  }
  async function undo(i: Item) {
    if (!i.log?.id) return
    await db.logs.delete(i.log.id)
  }

  return (
    <div className="px-5 pt-12">
      <header className="mb-8">
        <p className="text-sm text-ink-300">{greeting}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-50">
          のんだ？
        </h1>
        <p className="mt-2 text-sm text-ink-300">
          {meds.length === 0
            ? 'まずはおくすりを登録しましょう'
            : pending.length === 0
            ? items.length === 0
              ? '今日のぶんはありません'
              : '今日のぶん、ぜんぶ完了！'
            : `あと ${pending.length} 回`}
        </p>
      </header>

      {pending.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-400">
            これから
          </h2>
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {pending.map((i) => {
                const overdue = i.scheduledMin <= now
                return (
                  <motion.li
                    key={i.schedule.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-sm">
                      <span
                        className="block h-12 w-1.5 shrink-0 rounded-full"
                        style={{ background: i.med.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-50">{i.med.name}</p>
                        <p className="text-xs text-ink-300">
                          {i.med.dose} ・ {describeSchedule(i.schedule)}
                          {overdue && (
                            <span className="ml-2 text-coral-300">予定時刻</span>
                          )}
                        </p>
                      </div>
                      <p className="mr-1 text-sm tabular-nums text-ink-200">
                        {i.timeStr}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.92 }}
                        onClick={() => take(i)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint-400 text-ink-50 shadow-lg shadow-mint-500/20"
                        aria-label="飲んだ"
                      >
                        <Check size={22} strokeWidth={3} />
                      </motion.button>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-ink-400">
            のんだ
          </h2>
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {done.map((i) => (
                <motion.li
                  key={i.schedule.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex items-center gap-3 rounded-xl border border-ink-700/70 bg-ink-700/30 p-3">
                    <span
                      className="block h-8 w-1 shrink-0 rounded-full opacity-50"
                      style={{ background: i.med.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-200 line-through decoration-ink-500">
                        {i.med.name}
                      </p>
                      <p className="text-[11px] text-ink-400">
                        {i.timeStr} ・ {i.med.dose}
                      </p>
                    </div>
                    <button
                      onClick={() => undo(i)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:text-ink-100"
                      aria-label="取り消し"
                    >
                      <Undo2 size={16} />
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </section>
      )}

      {items.length === 0 && meds.length > 0 && (
        <div className="mt-12 rounded-2xl border border-ink-700 bg-ink-700/30 p-6 text-center text-sm text-ink-300">
          今日（{['日','月','火','水','木','金','土'][wd]}曜）のスケジュールはありません
        </div>
      )}
    </div>
  )
}
