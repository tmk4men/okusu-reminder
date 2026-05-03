import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Pill } from 'lucide-react'
import { db } from '../db/schema'
import type { Medication, Schedule } from '../db/types'
import { describeSchedule } from '../lib/schedule'
import { MedicationForm } from './MedicationForm'

export function Medications() {
  const meds = useLiveQuery(() => db.medications.toArray()) ?? []
  const schedules = useLiveQuery(() => db.schedules.toArray()) ?? []
  const [editing, setEditing] = useState<{ med?: Medication; open: boolean }>({ open: false })

  const active = meds.filter((m) => !m.archived)
  const schedMap = new Map<number, Schedule[]>()
  for (const s of schedules) {
    const arr = schedMap.get(s.medicationId) ?? []
    arr.push(s)
    schedMap.set(s.medicationId, arr)
  }

  return (
    <div className="px-5 pt-12">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-50">おくすり</h1>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => setEditing({ open: true })}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-mint-400 text-ink-900 shadow-lg shadow-mint-500/20"
          aria-label="追加"
        >
          <Plus size={22} strokeWidth={2.6} />
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
            return (
              <li key={m.id}>
                <button
                  onClick={() => setEditing({ med: m, open: true })}
                  className="flex w-full items-center gap-3 rounded-2xl border border-ink-700 bg-ink-800 p-4 text-left transition-transform active:scale-[0.99]"
                >
                  <span
                    className="block h-12 w-1.5 shrink-0 rounded-full"
                    style={{ background: m.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-50">{m.name}</p>
                    <p className="text-xs text-ink-300">
                      {m.dose}
                      {ss.length > 0 && ' ・ ' + ss.map((s) => describeSchedule(s)).join(' / ')}
                    </p>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <AnimatePresence>
        {editing.open && (
          <MedicationForm
            med={editing.med}
            schedules={editing.med ? schedMap.get(editing.med.id!) : []}
            onClose={() => setEditing({ open: false })}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
