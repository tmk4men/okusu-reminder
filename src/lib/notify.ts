import { db } from '../db/schema'
import type { Medication, Schedule, MealTimes } from '../db/types'
import { DEFAULT_MEAL_TIMES } from '../db/types'
import { todayKey, nowMinutes, todayWeekday } from './date'
import { isToday, scheduledMinutes } from './schedule'

export const SNOOZE_MINUTES = 10

export function notificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  if (!notificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationSupported()) return 'denied'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

interface PendingTimeout {
  scheduleId: number
  timeoutId: number
  fireAt: number
}

const timeouts = new Map<number, PendingTimeout>()

function clearAll() {
  for (const t of timeouts.values()) clearTimeout(t.timeoutId)
  timeouts.clear()
}

export async function rescheduleToday(): Promise<void> {
  if (!notificationSupported() || Notification.permission !== 'granted') {
    clearAll()
    return
  }

  const [meds, schedules, settingRow, todayLogs, snoozes] = await Promise.all([
    db.medications.toArray(),
    db.schedules.toArray(),
    db.settings.get('mealTimes'),
    db.logs.where('date').equals(todayKey()).toArray(),
    db.snoozes.toArray(),
  ])
  const meals = ((settingRow?.value as MealTimes) ?? DEFAULT_MEAL_TIMES) as MealTimes
  const medMap = new Map(meds.map((m) => [m.id!, m]))
  const takenIds = new Set(todayLogs.map((l) => l.scheduleId))
  const snoozeMap = new Map(snoozes.map((s) => [s.scheduleId, s.until]))
  const wd = todayWeekday()
  const now = Date.now()
  const nowMin = nowMinutes()

  clearAll()

  // expire stale snoozes
  const expired = snoozes.filter((s) => s.until < now).map((s) => s.scheduleId)
  if (expired.length) await db.snoozes.bulkDelete(expired)

  for (const s of schedules) {
    if (!isToday(s, wd)) continue
    if (takenIds.has(s.id!)) continue
    const med = medMap.get(s.medicationId)
    if (!med || med.archived) continue

    const snoozeUntil = snoozeMap.get(s.id!)
    let fireAt: number
    if (snoozeUntil && snoozeUntil > now) {
      fireAt = snoozeUntil
    } else {
      const mins = scheduledMinutes(s, meals)
      const delaySec = (mins - nowMin) * 60
      if (delaySec <= 0 || delaySec > 12 * 3600) continue
      fireAt = now + delaySec * 1000
    }

    const delay = fireAt - now
    if (delay <= 0 || delay > 24 * 3600 * 1000) continue

    const timeoutId = window.setTimeout(() => {
      fireDoseNotification(s, med).catch((err) => console.warn(err))
      timeouts.delete(s.id!)
    }, delay)
    timeouts.set(s.id!, { scheduleId: s.id!, timeoutId, fireAt })
  }
}

async function fireDoseNotification(s: Schedule, med: Medication): Promise<void> {
  const reg = await navigator.serviceWorker?.getRegistration()
  const title = `${med.name} の時間`
  const options: NotificationOptions = {
    body: `${med.dose} を のんだ？`,
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: `dose-${s.id}`,
    requireInteraction: true,
    data: { scheduleId: s.id, dateKey: todayKey() },
    // @ts-expect-error actions is supported in SW notifications
    actions: [
      { action: 'taken', title: 'のんだ' },
      { action: 'later', title: 'あとで' },
    ],
  }
  if (reg) {
    await reg.showNotification(title, options)
  } else if (notificationSupported()) {
    new Notification(title, options)
  }
}

export async function snoozeSchedule(scheduleId: number, minutes = SNOOZE_MINUTES): Promise<void> {
  const until = Date.now() + minutes * 60 * 1000
  await db.snoozes.put({ scheduleId, until })
  await rescheduleToday()
}

export async function cancelSnooze(scheduleId: number): Promise<void> {
  await db.snoozes.delete(scheduleId)
}

export async function showTestNotification(): Promise<void> {
  if (Notification.permission !== 'granted') return
  const reg = await navigator.serviceWorker?.getRegistration()
  const title = 'おくすリマインダー'
  const opts: NotificationOptions = {
    body: '通知テスト：このように届きます',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: 'test',
  }
  if (reg) await reg.showNotification(title, opts)
  else new Notification(title, opts)
}
