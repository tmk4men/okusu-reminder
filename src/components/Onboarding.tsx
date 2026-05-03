import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, ChevronRight } from 'lucide-react'
import { Character } from './Character'
import { celebrateAllDone } from '../lib/celebrate'
import { vibrate } from '../lib/haptic'
import {
  notificationPermission,
  requestNotificationPermission,
  type PermState,
} from '../lib/notify'
import { DEFAULT_MEAL_TIMES, type MealTimes } from '../db/types'
import { getMealTimes, setMealTimes } from '../lib/storage'

const STORAGE_KEY = 'okusu-onboarded'

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true
  }
}

function markOnboarded() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* ignore */
  }
}

interface Props {
  onComplete: () => void
}

export function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const total = 3

  function next() {
    vibrate('tap')
    if (step < total - 1) setStep(step + 1)
    else finish()
  }

  function finish() {
    markOnboarded()
    celebrateAllDone()
    vibrate('success')
    onComplete()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-ink-900"
    >
      <div className="flex-1 overflow-y-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {step === 0 && <SlideWelcome key="0" />}
          {step === 1 && <SlideConcept key="1" />}
          {step === 2 && <SlideSetup key="2" />}
        </AnimatePresence>
      </div>

      <div className="border-t border-ink-700 bg-ink-900 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="mb-4 flex items-center justify-center gap-2">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-mint-400' : 'w-1.5 bg-ink-700'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          {step < total - 1 ? (
            <button
              onClick={() => {
                markOnboarded()
                onComplete()
              }}
              className="text-sm text-ink-400"
            >
              スキップ
            </button>
          ) : (
            <span />
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={next}
            className="inline-flex items-center gap-2 rounded-full bg-mint-400 px-6 py-3 text-sm font-medium text-ink-50 shadow-lg shadow-mint-500/30"
          >
            {step < total - 1 ? '次へ' : 'はじめる'}
            <ChevronRight size={18} strokeWidth={2.6} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

function SlideWelcome() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center justify-center text-center"
    >
      <div className="mb-6">
        <Character stage="toddler" size={200} />
      </div>
      <h2 className="text-2xl font-semibold text-ink-50">
        はじめまして、<br />のんちゃんです
      </h2>
      <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-300">
        あなたのおくすりを<br />
        一緒に見守るペンギンです。
      </p>
      <p className="mt-8 text-xs text-ink-400">
        のんで育てよう
      </p>
    </motion.section>
  )
}

function SlideConcept() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center justify-center px-2 text-center"
    >
      <h2 className="mb-2 text-2xl font-semibold text-ink-50">
        「のんだ？」に<br />
        ワンタップで答えるだけ
      </h2>
      <p className="mb-8 text-sm text-ink-300">
        忙しい朝も、夜寝る前も、迷わない。
      </p>

      <div className="w-full max-w-xs space-y-3">
        <DemoCard name="ビタミンC" sub="1錠 ・ 朝食後" time="8:00" pending />
        <DemoCard name="頭痛薬" sub="1錠 ・ 13:00" time="13:00" />
      </div>

      <p className="mt-8 max-w-xs text-xs leading-relaxed text-ink-400">
        ✓ を押すと記録される。<br />
        「飲んだっけ？」がもう来ない。
      </p>
    </motion.section>
  )
}

function DemoCard({
  name,
  sub,
  time,
  pending = false,
}: {
  name: string
  sub: string
  time: string
  pending?: boolean
}) {
  return (
    <motion.div
      animate={pending ? {} : { opacity: [1, 0.5, 1] }}
      transition={{ duration: 1.4, repeat: pending ? 0 : Infinity }}
      className="flex items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left"
    >
      <span
        className="block h-10 w-1.5 shrink-0 rounded-full"
        style={{ background: pending ? '#fbbf24' : '#34d399' }}
      />
      <div className="flex-1">
        <p className="font-medium text-ink-50">{name}</p>
        <p className="text-xs text-ink-300">{sub}</p>
      </div>
      <span className="text-sm tabular-nums text-ink-200">{time}</span>
      <motion.span
        animate={pending ? { scale: [1, 1.12, 1] } : {}}
        transition={{ duration: 1.4, repeat: pending ? Infinity : 0 }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-mint-400 text-ink-50 shadow shadow-mint-500/30"
      >
        <Check size={18} strokeWidth={3} />
      </motion.span>
    </motion.div>
  )
}

function SlideSetup() {
  const [perm, setPerm] = useState<PermState>('default')
  const [meals, setMealsState] = useState<MealTimes>(DEFAULT_MEAL_TIMES)

  useEffect(() => {
    notificationPermission().then(setPerm)
    getMealTimes().then(setMealsState)
  }, [])

  async function enableNotif() {
    const p = await requestNotificationPermission()
    setPerm(p)
  }

  async function updateMeal(key: keyof MealTimes, time: string) {
    const next = { ...meals, [key]: time }
    setMealsState(next)
    await setMealTimes(next)
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="flex h-full flex-col items-center pt-2"
    >
      <h2 className="mb-2 text-center text-2xl font-semibold text-ink-50">
        まずはここから
      </h2>
      <p className="mb-8 text-center text-sm text-ink-300">
        あとで設定タブからも変更できます
      </p>

      <div className="w-full max-w-xs space-y-4">
        <button
          onClick={enableNotif}
          disabled={perm === 'granted' || perm === 'denied' || perm === 'unsupported'}
          className="flex w-full items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left disabled:opacity-70"
        >
          <Bell
            size={20}
            className={perm === 'granted' ? 'text-mint-400' : 'text-mint-500'}
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-ink-50">
              通知を有効にする
            </p>
            <p className="mt-0.5 text-[11px] text-ink-400">
              {perm === 'granted'
                ? '許可済み ✓'
                : perm === 'denied'
                ? 'ブロック中（設定から変更）'
                : perm === 'unsupported'
                ? 'このブラウザは非対応'
                : '予定時刻にお知らせします'}
            </p>
          </div>
        </button>

        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-4">
          <p className="mb-3 text-sm font-medium text-ink-50">食事の時刻</p>
          <div className="space-y-2">
            <MealRow label="朝食" value={meals.breakfast} onChange={(v) => updateMeal('breakfast', v)} />
            <MealRow label="昼食" value={meals.lunch} onChange={(v) => updateMeal('lunch', v)} />
            <MealRow label="夕食" value={meals.dinner} onChange={(v) => updateMeal('dinner', v)} />
          </div>
          <p className="mt-2 text-[11px] text-ink-400">
            「食後30分」など相対指定の基準
          </p>
        </div>
      </div>
    </motion.section>
  )
}

function MealRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-200">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-base tabular-nums text-ink-50 outline-none focus:border-mint-400"
      />
    </div>
  )
}
