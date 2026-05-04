import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { db } from '../db/schema'
import { MED_COLORS } from '../db/types'
import type { Medication, Schedule, Weekday, Meal } from '../db/types'
import { todayKey } from '../lib/date'

const DAYS: { v: Weekday; label: string }[] = [
  { v: 0, label: '日' },
  { v: 1, label: '月' },
  { v: 2, label: '火' },
  { v: 3, label: '水' },
  { v: 4, label: '木' },
  { v: 5, label: '金' },
  { v: 6, label: '土' },
]

const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6]

interface Props {
  med?: Medication
  schedules?: Schedule[]
  onClose: () => void
}

interface DraftSchedule {
  id?: number
  mode: 'fixed' | 'relative'
  time: string
  meal: Meal
  offsetMin: number
  days: Weekday[]
  enabled: boolean
}

type PeriodMode = 'indefinite' | 'limited'
type PeriodUnit = 'days' | 'weeks'

function diffDaysInclusive(start: string, end: string): number {
  const a = new Date(start + 'T00:00:00')
  const b = new Date(end + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1
}

function addDaysKey(start: string, days: number): string {
  const d = new Date(start + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return todayKey(d)
}

function inferPeriod(med?: Medication): {
  mode: PeriodMode
  startDate: string
  value: number
  unit: PeriodUnit
} {
  const today = todayKey()
  if (!med || !med.endDate) {
    return { mode: 'indefinite', startDate: med?.startDate ?? today, value: 7, unit: 'days' }
  }
  const start = med.startDate ?? today
  const days = Math.max(1, diffDaysInclusive(start, med.endDate))
  if (days % 7 === 0) {
    return { mode: 'limited', startDate: start, value: days / 7, unit: 'weeks' }
  }
  return { mode: 'limited', startDate: start, value: days, unit: 'days' }
}

function toDraft(s?: Schedule): DraftSchedule {
  return {
    id: s?.id,
    mode: s?.mode ?? 'fixed',
    time: s?.time ?? '08:00',
    meal: s?.meal ?? 'breakfast',
    offsetMin: s?.offsetMin ?? 0,
    days: s?.days ?? ALL_DAYS,
    enabled: s?.enabled ?? true,
  }
}

export function MedicationForm({ med, schedules = [], onClose }: Props) {
  const isEdit = !!med
  const [name, setName] = useState(med?.name ?? '')
  const [dose, setDose] = useState(med?.dose ?? '1錠')
  const [color, setColor] = useState(med?.color ?? MED_COLORS[3])
  const [drafts, setDrafts] = useState<DraftSchedule[]>(
    schedules.length > 0 ? schedules.map(toDraft) : [toDraft()],
  )
  const initialPeriod = inferPeriod(med)
  const [periodMode, setPeriodMode] = useState<PeriodMode>(initialPeriod.mode)
  const [periodStart, setPeriodStart] = useState<string>(initialPeriod.startDate)
  const [periodValue, setPeriodValue] = useState<number>(initialPeriod.value)
  const [periodUnit, setPeriodUnit] = useState<PeriodUnit>(initialPeriod.unit)

  function updateDraft(idx: number, patch: Partial<DraftSchedule>) {
    setDrafts((d) => d.map((s, i) => (i === idx ? { ...s, ...patch } : s)))
  }
  function toggleDay(idx: number, day: Weekday) {
    setDrafts((d) =>
      d.map((s, i) =>
        i === idx
          ? {
              ...s,
              days: s.days.includes(day) ? s.days.filter((x) => x !== day) : [...s.days, day].sort(),
            }
          : s,
      ),
    )
  }

  async function save() {
    if (!name.trim()) return
    const start = periodStart || todayKey()
    const totalDays =
      periodMode === 'limited'
        ? Math.max(1, Math.floor(periodValue || 0)) * (periodUnit === 'weeks' ? 7 : 1)
        : 0
    const endDate =
      periodMode === 'limited' && totalDays > 0 ? addDaysKey(start, totalDays - 1) : null
    let medId = med?.id
    if (isEdit && medId) {
      await db.medications.update(medId, {
        name: name.trim(),
        dose: dose.trim(),
        color,
        startDate: start,
        endDate,
      })
    } else {
      medId = await db.medications.add({
        name: name.trim(),
        dose: dose.trim() || '1錠',
        color,
        archived: false,
        createdAt: Date.now(),
        startDate: start,
        endDate,
      })
    }

    const existingIds = new Set(schedules.map((s) => s.id!))
    const keptIds = new Set(drafts.filter((d) => d.id).map((d) => d.id!))
    const toDelete = [...existingIds].filter((id) => !keptIds.has(id))
    if (toDelete.length) await db.schedules.bulkDelete(toDelete)

    for (const d of drafts) {
      if (d.days.length === 0) continue
      const payload: Schedule = {
        medicationId: medId!,
        mode: d.mode,
        days: d.days,
        enabled: d.enabled,
        ...(d.mode === 'fixed' ? { time: d.time } : { meal: d.meal, offsetMin: d.offsetMin }),
      }
      if (d.id) await db.schedules.put({ ...payload, id: d.id })
      else await db.schedules.add(payload)
    }
    onClose()
  }

  async function archive() {
    if (!med?.id) return
    if (!confirm(`「${med.name}」をリストから削除しますか？`)) return
    await db.medications.update(med.id, { archived: true })
    const ss = await db.schedules.where('medicationId').equals(med.id).toArray()
    await db.schedules.bulkDelete(ss.map((s) => s.id!))
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-30 bg-black/35 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[92svh] max-w-md overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-800 pb-[calc(env(safe-area-inset-bottom)+96px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-800/95 px-5 py-3 backdrop-blur">
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={22} />
          </button>
          <h2 className="text-base font-medium text-ink-50">
            {isEdit ? 'おくすりを編集' : 'おくすりを追加'}
          </h2>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="rounded-full bg-mint-400 px-4 py-1.5 text-sm font-medium text-ink-50 disabled:opacity-30"
          >
            保存
          </button>
        </div>

        <div className="space-y-6 px-5 py-6">
          <div className="space-y-2">
            <label className="text-xs text-ink-400">なまえ</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: ビタミンC"
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-ink-50 outline-none focus:border-mint-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-ink-400">1回あたり</label>
            <input
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="例: 1錠 / 2粒"
              className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-ink-50 outline-none focus:border-mint-400"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-ink-400">いろ</label>
            <div className="flex flex-wrap gap-3">
              {MED_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="relative h-9 w-9 rounded-full ring-offset-2 ring-offset-ink-800"
                  style={{ background: c, boxShadow: c === color ? `0 0 0 2px ${c}` : undefined }}
                  aria-label={c}
                >
                  {c === color && (
                    <Check size={16} className="absolute inset-0 m-auto text-ink-50" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-ink-400">服薬期間</label>
            <div className="space-y-3 rounded-2xl border border-ink-700 bg-ink-900/60 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={periodUnit === 'weeks' ? 52 : 365}
                  value={periodValue}
                  disabled={periodMode === 'indefinite'}
                  onChange={(e) =>
                    setPeriodValue(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-20 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-center text-lg tabular-nums text-ink-50 outline-none focus:border-mint-400 disabled:opacity-40"
                />
                <select
                  value={periodMode === 'indefinite' ? 'indefinite' : periodUnit}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === 'indefinite') {
                      setPeriodMode('indefinite')
                    } else {
                      setPeriodMode('limited')
                      setPeriodUnit(v as PeriodUnit)
                    }
                  }}
                  className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-ink-50 outline-none focus:border-mint-400"
                >
                  <option value="days">日間</option>
                  <option value="weeks">週間</option>
                  <option value="indefinite">無期限</option>
                </select>
              </div>
              {periodMode === 'limited' && (
                <div className="flex items-center gap-2">
                  <label className="shrink-0 text-xs text-ink-400">開始日</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value || todayKey())}
                    className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-3 py-2 text-ink-50 outline-none focus:border-mint-400"
                  />
                  <span className="shrink-0 text-xs text-ink-400">
                    〜{' '}
                    {addDaysKey(
                      periodStart || todayKey(),
                      Math.max(1, Math.floor(periodValue || 1)) *
                        (periodUnit === 'weeks' ? 7 : 1) -
                        1,
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs text-ink-400">スケジュール</label>
              <button
                type="button"
                onClick={() => setDrafts((d) => [...d, toDraft()])}
                className="inline-flex items-center gap-1 text-xs text-mint-400"
              >
                <Plus size={14} /> 追加
              </button>
            </div>

            {drafts.map((d, idx) => (
              <div
                key={idx}
                className="space-y-3 rounded-2xl border border-ink-700 bg-ink-900/60 p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="inline-flex rounded-full bg-ink-800 p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => updateDraft(idx, { mode: 'fixed' })}
                      className={`rounded-full px-3 py-1.5 ${
                        d.mode === 'fixed' ? 'bg-mint-400 text-ink-50' : 'text-ink-300'
                      }`}
                    >
                      定刻
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDraft(idx, { mode: 'relative' })}
                      className={`rounded-full px-3 py-1.5 ${
                        d.mode === 'relative' ? 'bg-mint-400 text-ink-50' : 'text-ink-300'
                      }`}
                    >
                      食事から
                    </button>
                  </div>
                  {drafts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setDrafts((arr) => arr.filter((_, i) => i !== idx))}
                      className="text-ink-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                {d.mode === 'fixed' ? (
                  <input
                    type="time"
                    value={d.time}
                    onChange={(e) => updateDraft(idx, { time: e.target.value })}
                    className="w-full rounded-xl border border-ink-700 bg-ink-900 px-4 py-3 text-lg tabular-nums text-ink-50 outline-none focus:border-mint-400"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <select
                      value={d.meal}
                      onChange={(e) => updateDraft(idx, { meal: e.target.value as Meal })}
                      className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-ink-50 outline-none focus:border-mint-400"
                    >
                      <option value="breakfast">朝食</option>
                      <option value="lunch">昼食</option>
                      <option value="dinner">夕食</option>
                    </select>
                    <select
                      value={d.offsetMin}
                      onChange={(e) => updateDraft(idx, { offsetMin: Number(e.target.value) })}
                      className="flex-1 rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-ink-50 outline-none focus:border-mint-400"
                    >
                      <option value={-30}>30分前</option>
                      <option value={-15}>15分前</option>
                      <option value={0}>すぐ</option>
                      <option value={15}>15分後</option>
                      <option value={30}>30分後</option>
                      <option value={60}>1時間後</option>
                    </select>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateDraft(idx, { days: ALL_DAYS })}
                    className="rounded-full border border-ink-700 px-2 py-1 text-[11px] text-ink-300"
                  >
                    毎日
                  </button>
                  <button
                    type="button"
                    onClick={() => updateDraft(idx, { days: [1, 2, 3, 4, 5] })}
                    className="rounded-full border border-ink-700 px-2 py-1 text-[11px] text-ink-300"
                  >
                    平日
                  </button>
                  {DAYS.map((day) => {
                    const on = d.days.includes(day.v)
                    return (
                      <button
                        key={day.v}
                        type="button"
                        onClick={() => toggleDay(idx, day.v)}
                        className={`h-8 w-8 rounded-full text-sm transition-colors ${
                          on ? 'bg-mint-400 text-ink-50' : 'bg-ink-800 text-ink-300'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {isEdit && (
            <button
              onClick={archive}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-coral-500/30 py-3 text-sm text-coral-400"
            >
              <Trash2 size={16} /> このおくすりを削除
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
