import { LocalNotifications } from '@capacitor/local-notifications'
import { db } from '../db/schema'
import type { Medication, Schedule, MealTimes } from '../db/types'
import { DEFAULT_MEAL_TIMES } from '../db/types'
import { todayKey, nowMinutes, todayWeekday } from './date'
import { isToday, scheduledMinutes } from './schedule'
import { isNative } from './platform'

export const SNOOZE_MINUTES = 10
const ACTION_TYPE_ID = 'DOSE'

export type PermState = 'granted' | 'denied' | 'default' | 'unsupported'

export function notificationSupported(): boolean {
  if (isNative()) return true
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function notificationPermission(): Promise<PermState> {
  if (!notificationSupported()) return 'unsupported'
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions()
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default'
  }
  return Notification.permission as PermState
}

export async function requestNotificationPermission(): Promise<PermState> {
  if (!notificationSupported()) return 'denied'
  if (isNative()) {
    const { display } = await LocalNotifications.requestPermissions()
    return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'default'
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission as PermState
  }
  const r = await Notification.requestPermission()
  return r as PermState
}

export async function setupNotificationActions(): Promise<void> {
  if (!isNative()) return
  await LocalNotifications.registerActionTypes({
    types: [
      {
        id: ACTION_TYPE_ID,
        actions: [
          { id: 'taken', title: 'のんだ' },
          { id: 'later', title: 'あとで' },
        ],
      },
    ],
  })

  LocalNotifications.removeAllListeners().catch(() => {})
  await LocalNotifications.addListener('localNotificationActionPerformed', async (event) => {
    const data = event.notification.extra as { scheduleId?: number; dateKey?: string } | undefined
    if (!data?.scheduleId) return
    const action = event.actionId
    if (action === 'taken' || action === 'tap') {
      await db.logs.add({
        scheduleId: data.scheduleId,
        date: data.dateKey || todayKey(),
        status: 'taken',
        recordedAt: Date.now(),
      })
    } else if (action === 'later') {
      await snoozeSchedule(data.scheduleId)
    }
  })
}

interface PendingTimeout {
  scheduleId: number
  timeoutId: number
  fireAt: number
}

const timeouts = new Map<number, PendingTimeout>()

async function clearAll() {
  for (const t of timeouts.values()) clearTimeout(t.timeoutId)
  timeouts.clear()
  if (isNative()) {
    try {
      const pending = await LocalNotifications.getPending()
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({
          notifications: pending.notifications.map((n) => ({ id: n.id })),
        })
      }
    } catch {
      /* ignore */
    }
  }
}

export async function rescheduleToday(): Promise<void> {
  const perm = await notificationPermission()
  if (perm !== 'granted') {
    await clearAll()
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

  await clearAll()

  const expired = snoozes.filter((s) => s.until < now).map((s) => s.scheduleId)
  if (expired.length) await db.snoozes.bulkDelete(expired)

  const native: Array<{ schedule: Schedule; med: Medication; fireAt: number }> = []

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

    if (isNative()) {
      native.push({ schedule: s, med, fireAt })
    } else {
      const timeoutId = window.setTimeout(() => {
        fireDoseNotification(s, med).catch((err) => console.warn(err))
        timeouts.delete(s.id!)
      }, delay)
      timeouts.set(s.id!, { scheduleId: s.id!, timeoutId, fireAt })
    }
  }

  if (isNative() && native.length > 0) {
    await LocalNotifications.schedule({
      notifications: native.map(({ schedule, med, fireAt }) => ({
        id: schedule.id!,
        title: `${med.name} の時間`,
        body: `${med.dose} を のんだ？`,
        schedule: { at: new Date(fireAt) },
        actionTypeId: ACTION_TYPE_ID,
        smallIcon: 'ic_stat_icon',
        extra: { scheduleId: schedule.id, dateKey: todayKey() },
      })),
    })
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
  const perm = await notificationPermission()
  if (perm !== 'granted') return

  if (isNative()) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999999,
          title: 'おくすリマインダー',
          body: '通知テスト：このように届きます',
          schedule: { at: new Date(Date.now() + 1500) },
          smallIcon: 'ic_stat_icon',
        },
      ],
    })
    return
  }

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
