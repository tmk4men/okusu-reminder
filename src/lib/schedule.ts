import type { Schedule, MealTimes, Meal } from '../db/types'
import { timeToMinutes, minutesToTime } from './date'

const MEAL_LABEL: Record<Meal, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
}

export function scheduledMinutes(s: Schedule, meals: MealTimes): number {
  if (s.mode === 'fixed' && s.time) {
    return timeToMinutes(s.time)
  }
  if (s.mode === 'relative' && s.meal) {
    const base = timeToMinutes(meals[s.meal])
    return base + (s.offsetMin ?? 0)
  }
  return 0
}

export function scheduledTimeStr(s: Schedule, meals: MealTimes): string {
  return minutesToTime(scheduledMinutes(s, meals))
}

export function describeSchedule(s: Schedule): string {
  if (s.mode === 'fixed' && s.time) return s.time
  if (s.mode === 'relative' && s.meal) {
    const label = MEAL_LABEL[s.meal]
    const off = s.offsetMin ?? 0
    if (off === 0) return label
    if (off > 0) return `${label}後 ${off}分`
    return `${label}前 ${Math.abs(off)}分`
  }
  return '-'
}

export function isToday(s: Schedule, weekday: number): boolean {
  return s.enabled && s.days.includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6)
}
