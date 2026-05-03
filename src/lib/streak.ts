import { db } from '../db/schema'
import { todayKey } from './date'

export interface StreakInfo {
  current: number
  best: number
  thisWeek: number
}

function shiftDate(d: Date, days: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

export async function computeStreak(now = new Date()): Promise<StreakInfo> {
  const cutoff = shiftDate(now, -120)
  const recent = await db.logs
    .where('date')
    .between(toKey(cutoff), todayKey(now), true, true)
    .toArray()

  const tookOn = new Set<string>()
  for (const l of recent) tookOn.add(l.date)

  let current = 0
  let cursor = new Date(now)
  while (tookOn.has(toKey(cursor))) {
    current += 1
    cursor = shiftDate(cursor, -1)
  }

  let best = 0
  let run = 0
  let day = shiftDate(now, -119)
  for (let i = 0; i < 120; i++) {
    if (tookOn.has(toKey(day))) {
      run += 1
      if (run > best) best = run
    } else {
      run = 0
    }
    day = shiftDate(day, 1)
  }

  let thisWeek = 0
  for (let i = 0; i < 7; i++) {
    if (tookOn.has(toKey(shiftDate(now, -i)))) thisWeek += 1
  }

  return { current, best, thisWeek }
}

function toKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface DayLoad {
  date: string
  count: number
}

export async function recentDailyCounts(days: number, now = new Date()): Promise<DayLoad[]> {
  const start = shiftDate(now, -(days - 1))
  const logs = await db.logs
    .where('date')
    .between(toKey(start), todayKey(now), true, true)
    .toArray()

  const counts = new Map<string, number>()
  for (const l of logs) counts.set(l.date, (counts.get(l.date) ?? 0) + 1)

  const result: DayLoad[] = []
  for (let i = 0; i < days; i++) {
    const d = shiftDate(start, i)
    const k = toKey(d)
    result.push({ date: k, count: counts.get(k) ?? 0 })
  }
  return result
}
