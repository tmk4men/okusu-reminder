import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pill, Lock } from 'lucide-react'
import { db } from '../db/schema'
import type { Medication, Schedule } from '../db/types'
import { describeSchedule, describePeriod, isMedActiveOn } from '../lib/schedule'
import { FREE_MED_LIMIT, usePremium } from '../lib/premium'
import { MedicationForm } from './MedicationForm'
import { PremiumModal } from './PremiumModal'

export function Medications() {
  const meds = useLiveQuery(() => db.medications.toArray()) ?? []
  const schedules = useLiveQuery(() => db.schedules.toArray()) ?? []
  const premium = usePremium()
  const [editing, setEditing] = useState<{ med?: Medication; open: boolean }>({ open: false })
  const [showPremium, setShowPremium] = useState(false)

  const active = meds.filter((m) => !m.archived)
  const schedMap = new Map<number, Schedule[]>()
  for (const s of schedules) {
    const arr = schedMap.get(s.medicationId) ?? []
    arr.push(s)
    schedMap.set(s.medicationId, arr)
  }

  const reachedLimit = !premium && active.length >= FREE_MED_LIMIT

  function handleAdd() {
    if (reachedLimit) {
      setShowPremium(true)
      return
    }
    setEditing({ open: true })
  }

  return (
    <div className="px-5 pt-16">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-50">おくすり</h1>
          {!premium && (
            <p className="mt-1 text-xs text-ink-400">
              無料版 {active.length} / {FREE_MED_LIMIT} 個
            </p>
          )}
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleAdd}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-ink-50 shadow-lg ${
            reachedLimit
              ? 'bg-ink-700 shadow-ink-900/40'
              : 'bg-mint-400 shadow-mint-500/20'
          }`}
          aria-label={reachedLimit ? 'プレミアムで解放' : '追加'}
        >
          {reachedLimit ? <Lock size={20} strokeWidth={2.4} /> : <Plus size={22} strokeWidth={2.6} />}
        </motion.button>
      </header>

      {active.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-800 text-ink-400">
            <Pill size={28} />
          </div>
          <p className="text-ink-200">まだおくすりが登録されていません</p>
          <p className="mt-1 text-sm text-ink-400">右上の＋から追加できます</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((m) => {
            const ss = schedMap.get(m.id!) ?? []
            const period = describePeriod(m)
            const ended = !isMedActiveOn(m)
            return (
              <li key={m.id}>
                <button
                  onClick={() => setEditing({ med: m, open: true })}
                  className={`flex w-full items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left transition-transform active:scale-[0.99] ${
                    ended ? 'opacity-50' : ''
                  }`}
                >
                  <span
                    className="block h-12 w-1.5 shrink-0 rounded-full"
                    style={{ background: m.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-50">
                      {m.name}
                      {ended && (
                        <span className="ml-2 rounded-full bg-ink-700 px-2 py-0.5 align-middle text-[10px] text-ink-300">
                          期間終了
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-ink-300">
                      {m.dose}
                      {ss.length > 0 && ' ・ ' + ss.map((s) => describeSchedule(s)).join(' / ')}
                      {period && <span className="ml-1 text-ink-400">・ {period}</span>}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {reachedLimit && (
        <button
          onClick={() => setShowPremium(true)}
          className="mt-6 flex w-full items-center justify-between rounded-2xl border border-mint-400/30 bg-mint-400/10 px-4 py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-mint-400/20 text-mint-300">
              <Lock size={16} />
            </span>
            <div>
              <p className="text-sm font-medium text-ink-50">登録枠がいっぱいです</p>
              <p className="text-xs text-ink-300">プレミアムで無制限に登録 ・ 広告も非表示</p>
            </div>
          </div>
          <span className="rounded-full bg-mint-400 px-3 py-1 text-xs font-medium text-ink-50">
            ¥500
          </span>
        </button>
      )}

      <AnimatePresence>
        {editing.open && (
          <MedicationForm
            med={editing.med}
            schedules={editing.med ? schedMap.get(editing.med.id!) : []}
            onClose={() => setEditing({ open: false })}
          />
        )}
        {showPremium && (
          <PremiumModal reason="limit" onClose={() => setShowPremium(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
