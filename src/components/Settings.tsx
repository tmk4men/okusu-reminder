import { useEffect, useState } from 'react'
import { Sunrise, Sun, Moon, Heart, Bell, BellOff, BellRing, AlertTriangle } from 'lucide-react'
import { DEFAULT_MEAL_TIMES, type MealTimes } from '../db/types'
import { getMealTimes, setMealTimes } from '../lib/storage'
import {
  notificationPermission,
  requestNotificationPermission,
  showTestNotification,
  rescheduleToday,
  type PermState,
} from '../lib/notify'

const ROWS: { key: keyof MealTimes; label: string; Icon: typeof Sun }[] = [
  { key: 'breakfast', label: '朝食', Icon: Sunrise },
  { key: 'lunch', label: '昼食', Icon: Sun },
  { key: 'dinner', label: '夕食', Icon: Moon },
]

export function Settings() {
  const [meals, setMeals] = useState<MealTimes>(DEFAULT_MEAL_TIMES)
  const [saved, setSaved] = useState(false)
  const [perm, setPerm] = useState<PermState>('default')

  useEffect(() => {
    getMealTimes().then(setMeals)
    notificationPermission().then(setPerm)
  }, [])

  async function update(key: keyof MealTimes, time: string) {
    const next = { ...meals, [key]: time }
    setMeals(next)
    await setMealTimes(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  async function enableNotifications() {
    const p = await requestNotificationPermission()
    setPerm(p)
    if (p === 'granted') {
      await rescheduleToday()
    }
  }

  return (
    <div className="px-5 pt-16">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-50">設定</h1>
      </header>

      <section className="mb-8 space-y-3">
        <h2 className="px-1 text-xs font-medium uppercase tracking-widest text-ink-400">
          通知
        </h2>
        <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
          {perm === 'unsupported' ? (
            <div className="flex items-center gap-3 px-4 py-4">
              <BellOff size={20} className="text-ink-400" />
              <p className="flex-1 text-sm text-ink-300">
                このブラウザは通知に対応していません
              </p>
            </div>
          ) : perm === 'granted' ? (
            <>
              <div className="flex items-center gap-3 px-4 py-4">
                <BellRing size={20} className="text-mint-400" />
                <div className="flex-1">
                  <p className="text-ink-100">通知は有効です</p>
                  <p className="mt-0.5 text-xs text-ink-400">
                    アプリを開いている間、予定時刻にお知らせします
                  </p>
                </div>
              </div>
              <button
                onClick={() => showTestNotification()}
                className="block w-full border-t border-ink-700 px-4 py-3 text-left text-sm text-mint-400 active:bg-ink-700"
              >
                テスト通知を送る
              </button>
            </>
          ) : perm === 'denied' ? (
            <div className="flex items-start gap-3 px-4 py-4">
              <AlertTriangle size={20} className="mt-0.5 text-coral-400" />
              <div className="flex-1">
                <p className="text-ink-100">通知がブロックされています</p>
                <p className="mt-1 text-xs text-ink-300">
                  ブラウザの設定から「このサイトの通知を許可」に変更してください
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={enableNotifications}
              className="flex w-full items-center gap-3 px-4 py-4 text-left active:bg-ink-700"
            >
              <Bell size={20} className="text-mint-400" />
              <div className="flex-1">
                <p className="text-ink-100">通知を有効にする</p>
                <p className="mt-0.5 text-xs text-ink-400">
                  予定時刻にお知らせを受け取る
                </p>
              </div>
            </button>
          )}
        </div>
        <p className="px-1 text-[11px] leading-relaxed text-ink-400">
          ※ Web版の通知はブラウザ依存で、端末ロック中は届かない場合があります。確実な通知はAndroidアプリ版で対応予定。
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-medium uppercase tracking-widest text-ink-400">
            食事の時刻
          </h2>
          <span
            className={`text-xs text-mint-400 transition-opacity ${
              saved ? 'opacity-100' : 'opacity-0'
            }`}
          >
            保存しました
          </span>
        </div>
        <ul className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800">
          {ROWS.map(({ key, label, Icon }, i) => (
            <li
              key={key}
              className={`flex items-center gap-3 px-4 py-4 ${
                i > 0 ? 'border-t border-ink-700' : ''
              }`}
            >
              <Icon size={20} className="text-ink-300" />
              <span className="flex-1 text-ink-100">{label}</span>
              <input
                type="time"
                value={meals[key]}
                onChange={(e) => update(key, e.target.value)}
                className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-2 text-lg tabular-nums text-ink-50 outline-none focus:border-mint-400"
              />
            </li>
          ))}
        </ul>
        <p className="px-1 text-[11px] text-ink-400">
          「食後30分」など相対指定の基準になります
        </p>
      </section>

      <footer className="mt-12 text-center text-xs text-ink-400">
        <p className="inline-flex items-center gap-1">
          <Heart size={12} /> おくすリマインダー
        </p>
      </footer>
    </div>
  )
}
