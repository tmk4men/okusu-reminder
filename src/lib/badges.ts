import { db } from '../db/schema'
import { computeStreak } from './streak'

export interface BadgeStats {
  total: number
  bestStreak: number
  currentStreak: number
  uniqueDays: number
  weekdayMask: number
  medCount: number
  weekendCount: number
}

export interface BadgeDef {
  id: string
  name: string
  description: string
  emoji: string
  rank: 'bronze' | 'silver' | 'gold' | 'special'
  check: (s: BadgeStats) => boolean
}

export const BADGES: BadgeDef[] = [
  { id: 'first', name: '一歩目', description: 'はじめて記録した', emoji: '🌱', rank: 'bronze', check: (s) => s.total >= 1 },
  { id: 'three', name: '3日つづいた', description: 'ストリーク3日', emoji: '🔥', rank: 'bronze', check: (s) => s.bestStreak >= 3 },
  { id: 'week', name: '一週間', description: '7日連続', emoji: '✨', rank: 'silver', check: (s) => s.bestStreak >= 7 },
  { id: 'month', name: 'ひとつき', description: '30日連続', emoji: '🏆', rank: 'gold', check: (s) => s.bestStreak >= 30 },
  { id: 'hundred', name: '百日達成', description: '100日連続', emoji: '💎', rank: 'special', check: (s) => s.bestStreak >= 100 },
  { id: 'allweek', name: '全曜日制覇', description: '月〜日すべての曜日で達成', emoji: '🌈', rank: 'silver', check: (s) => s.weekdayMask === 0b1111111 },
  { id: 'count50', name: '50回のんだ', description: '累計50回', emoji: '🪴', rank: 'bronze', check: (s) => s.total >= 50 },
  { id: 'count100', name: '100回のんだ', description: '累計100回', emoji: '🌟', rank: 'silver', check: (s) => s.total >= 100 },
  { id: 'count500', name: '500回のんだ', description: '累計500回', emoji: '👑', rank: 'gold', check: (s) => s.total >= 500 },
  { id: 'variety', name: 'コレクター', description: 'おくすりを5つ以上登録', emoji: '🎒', rank: 'silver', check: (s) => s.medCount >= 5 },
  { id: 'weekend', name: '週末も', description: '土日に合計10回', emoji: '🌴', rank: 'silver', check: (s) => s.weekendCount >= 10 },
  { id: 'days30', name: '30日のんだ', description: '30日それぞれで記録', emoji: '📅', rank: 'gold', check: (s) => s.uniqueDays >= 30 },
]

export const RANK_STYLE: Record<BadgeDef['rank'], string> = {
  bronze: 'from-amber-200 to-amber-400',
  silver: 'from-slate-200 to-slate-400',
  gold: 'from-yellow-200 to-yellow-500',
  special: 'from-fuchsia-300 via-pink-300 to-amber-300',
}

export async function gatherStats(): Promise<BadgeStats> {
  const [logs, meds, streak] = await Promise.all([
    db.logs.toArray(),
    db.medications.toArray(),
    computeStreak(),
  ])

  const total = logs.length
  const dateSet = new Set<string>()
  let weekdayMask = 0
  let weekendCount = 0
  for (const l of logs) {
    dateSet.add(l.date)
    const d = new Date(l.date + 'T00:00:00')
    const wd = d.getDay()
    weekdayMask |= 1 << wd
    if (wd === 0 || wd === 6) weekendCount += 1
  }

  return {
    total,
    bestStreak: streak.best,
    currentStreak: streak.current,
    uniqueDays: dateSet.size,
    weekdayMask,
    medCount: meds.filter((m) => !m.archived).length,
    weekendCount,
  }
}
