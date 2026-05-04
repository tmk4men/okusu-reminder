export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6
export type Meal = 'breakfast' | 'lunch' | 'dinner'
export type DoseStatus = 'taken' | 'skipped'

export interface Medication {
  id?: number
  name: string
  dose: string
  color: string
  archived: boolean
  createdAt: number
  startDate?: string
  endDate?: string | null
}

export interface Schedule {
  id?: number
  medicationId: number
  mode: 'fixed' | 'relative'
  time?: string
  meal?: Meal
  offsetMin?: number
  days: Weekday[]
  enabled: boolean
}

export interface DoseLog {
  id?: number
  scheduleId: number
  date: string
  status: DoseStatus
  recordedAt: number
}

export interface Setting {
  key: string
  value: unknown
}

export interface Snooze {
  scheduleId: number
  until: number
}

export interface MealTimes {
  breakfast: string
  lunch: string
  dinner: string
}

export const DEFAULT_MEAL_TIMES: MealTimes = {
  breakfast: '07:30',
  lunch: '12:30',
  dinner: '19:00',
}

export const MED_COLORS = [
  '#fb7185',
  '#fb923c',
  '#fbbf24',
  '#34d399',
  '#22d3ee',
  '#60a5fa',
  '#a78bfa',
  '#f472b6',
] as const
