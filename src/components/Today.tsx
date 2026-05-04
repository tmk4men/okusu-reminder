import { useEffect, useMemo, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Undo2, Clock } from 'lucide-react'
import { db } from '../db/schema'
import type { Medication, Schedule, DoseLog, MealTimes } from '../db/types'
import { DEFAULT_MEAL_TIMES } from '../db/types'
import { todayKey, todayWeekday, nowMinutes } from '../lib/date'
import { describeSchedule, isToday, isMedActiveOn, scheduledMinutes, scheduledTimeStr } from '../lib/schedule'
import { computeStreak, type StreakInfo } from '../lib/streak'
import { snoozeSchedule, SNOOZE_MINUTES } from '../lib/notify'
import { vibrate } from '../lib/haptic'
import { pop, celebrateAllDone } from '../lib/celebrate'
import { StreakBadge } from './StreakBadge'
import { MiniCalendar } from './HistoryCalendar'

interface Item {
  schedule: Schedule
  med: Medication
  scheduledMin: number
  timeStr: string
  log?: DoseLog
}

function formatRecordedAt(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function Today() {
  const allMeds = useLiveQuery(() => db.medications.toArray()) ?? []
  const meds = allMeds.filter((m) => !m.archived)
  const schedules = useLiveQuery(() => db.schedules.toArray()) ?? []
  const dateKey = todayKey()
  const logs = useLiveQuery(() => db.logs.where('date').equals(dateKey).toArray(), [dateKey]) ?? []
  const mealRow = useLiveQuery(() => db.settings.get('mealTimes'), [])
  const meals = ((mealRow?.value as MealTimes) ?? DEFAULT_MEAL_TIMES) as MealTimes
  const snoozes = useLiveQuery(() => db.snoozes.toArray()) ?? []
  const snoozeMap = useMemo(() => new Map(snoozes.map((s) => [s.scheduleId, s.until])), [snoozes])

  const [streak, setStreak] = useState<StreakInfo>({ current: 0, best: 0, thisWeek: 0 })
  useEffect(() => {
    computeStreak().then(setStreak)
  }, [logs.length])

  const wd = todayWeekday()
  const medMap = useMemo(() => new Map(allMeds.map((m) => [m.id!, m])), [allMeds])
  const logMap = useMemo(() => new Map(logs.map((l) => [l.scheduleId, l])), [logs])

  const items: Item[] = useMemo(() => {
    const result: Item[] = []
    for (const s of schedules) {
      if (!isToday(s, wd)) continue
      const med = medMap.get(s.medicationId)
      if (!med || med.archived) continue
      if (!isMedActiveOn(med, dateKey)) continue
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
  const nowMs = Date.now()

  // celebrate when going from pending>0 to pending=0
  const prevPending = useRef<number>(pending.length)
  useEffect(() => {
    if (
      items.length > 0 &&
      pending.length === 0 &&
      prevPending.current > 0
    ) {
      celebrateAllDone()
      vibrate('celebrate')
    }
    prevPending.current = pending.length
  }, [pending.length, items.length])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 5) return 'こんばんは'
    if (h < 11) return 'おはようございます'
    if (h < 17) return 'こんにちは'
    return 'こんばんは'
  }, [])

  async function take(i: Item, evt?: React.MouseEvent) {
    if (evt) {
      const x = evt.clientX / window.innerWidth
      const y = evt.clientY / window.innerHeight
      pop({ x, y })
    }
    vibrate('success')
    await db.logs.add({
      scheduleId: i.schedule.id!,
      date: dateKey,
      status: 'taken',
      recordedAt: Date.now(),
    })
    window.dispatchEvent(new CustomEvent('dose-taken'))
  }
  async function undo(i: Item) {
    if (!i.log?.id) return
    vibrate('tap')
    await db.logs.delete(i.log.id)
  }
  async function later(i: Item) {
    vibrate('tap')
    await snoozeSchedule(i.schedule.id!)
  }

  const allDoneToday = items.length > 0 && pending.length === 0

  return (
    <div className="px-5 pt-16">
      <header className="mb-6">
        <p className="text-sm text-ink-300">{greeting}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink-50">
          {allDoneToday ? 'おつかれさま！' : 'のんだ？'}
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
        <div className="mt-3">
          <StreakBadge streak={streak} />
        </div>
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
                const snoozedUntil = snoozeMap.get(i.schedule.id!)
                const snoozed = snoozedUntil && snoozedUntil > nowMs
                return (
                  <motion.li
                    key={i.schedule.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 shadow-sm shadow-ink-300/10">
                      <span
                        className="block h-12 w-1.5 shrink-0 rounded-full"
                        style={{ background: i.med.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-50">{i.med.name}</p>
                        <p className="text-xs text-ink-300">
                          {i.med.dose} ・ {describeSchedule(i.schedule)}
                          {snoozed ? (
                            <span className="ml-2 text-ink-400">
                              {Math.ceil((snoozedUntil! - nowMs) / 60000)}分後
                            </span>
                          ) : overdue ? (
                            <span className="ml-2 text-coral-500">予定時刻</span>
                          ) : null}
                        </p>
                      </div>
                      <p className="mr-1 text-sm tabular-nums text-ink-200">{i.timeStr}</p>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => later(i)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 text-ink-300"
                        aria-label={`${SNOOZE_MINUTES}分あとで`}
                        title={`${SNOOZE_MINUTES}分あとで`}
                      >
                        <Clock size={16} />
                      </motion.button>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={(e) => take(i, e)}
                        className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-mint-400 text-ink-50 shadow-lg shadow-mint-500/30"
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
        <section className="mb-8">
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
                        {i.log?.recordedAt
                          ? `${formatRecordedAt(i.log.recordedAt)} にのんだ`
                          : i.timeStr}
                        ・ {i.med.dose}
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
        <div className="mb-8 rounded-2xl border border-ink-700 bg-ink-700/30 p-6 text-center text-sm text-ink-300">
          今日（{['日', '月', '火', '水', '木', '金', '土'][wd]}曜）のスケジュールはありません
        </div>
      )}

      <section className="mb-8">
        <MiniCalendar refreshKey={logs.length} />
      </section>
    </div>
  )
}
