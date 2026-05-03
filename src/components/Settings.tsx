import { useEffect, useState } from 'react'
import { Sunrise, Sun, Moon, Heart } from 'lucide-react'
import { DEFAULT_MEAL_TIMES, type MealTimes } from '../db/types'
import { getMealTimes, setMealTimes } from '../lib/storage'

const ROWS: { key: keyof MealTimes; label: string; Icon: typeof Sun }[] = [
  { key: 'breakfast', label: '朝食', Icon: Sunrise },
  { key: 'lunch', label: '昼食', Icon: Sun },
  { key: 'dinner', label: '夕食', Icon: Moon },
]

export function Settings() {
  const [meals, setMeals] = useState<MealTimes>(DEFAULT_MEAL_TIMES)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getMealTimes().then(setMeals)
  }, [])

  async function update(key: keyof MealTimes, time: string) {
    const next = { ...meals, [key]: time }
    setMeals(next)
    await setMealTimes(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  return (
    <div className="px-5 pt-12">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-50">設定</h1>
        <p className="mt-2 text-sm text-ink-300">
          食事の時刻を登録すると「食後30分」などの相対指定が使えます
        </p>
      </header>

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
      </section>

      <footer className="mt-12 space-y-2 text-center text-xs text-ink-400">
        <p className="inline-flex items-center gap-1">
          <Heart size={12} /> おくすリマインダー v0.1
        </p>
        <p>by tmk4men</p>
      </footer>
    </div>
  )
}
