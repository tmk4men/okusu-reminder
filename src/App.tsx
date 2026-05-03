import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout } from './components/Layout'
import { Today } from './components/Today'
import { Medications } from './components/Medications'
import { Settings } from './components/Settings'
import { db } from './db/schema'
import { rescheduleToday } from './lib/notify'
import { todayKey } from './lib/date'

export type Tab = 'today' | 'meds' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')

  const meds = useLiveQuery(() => db.medications.toArray())
  const schedules = useLiveQuery(() => db.schedules.toArray())
  const settings = useLiveQuery(() => db.settings.toArray())
  const todayLogs = useLiveQuery(() => db.logs.where('date').equals(todayKey()).toArray())

  useEffect(() => {
    rescheduleToday()
  }, [meds, schedules, settings, todayLogs])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const take = params.get('take')
    if (take) {
      db.logs.add({
        scheduleId: Number(take),
        date: todayKey(),
        status: 'taken',
        recordedAt: Date.now(),
      })
      history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (e: MessageEvent) => {
      const msg = e.data
      if (msg?.type !== 'notification-action') return
      const { action, data } = msg
      if (action === 'taken' && data?.scheduleId) {
        db.logs.add({
          scheduleId: data.scheduleId,
          date: data.dateKey || todayKey(),
          status: 'taken',
          recordedAt: Date.now(),
        })
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [])

  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible') rescheduleToday()
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [])

  return (
    <Layout active={tab} onChange={setTab}>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {tab === 'today' && <Today />}
          {tab === 'meds' && <Medications />}
          {tab === 'settings' && <Settings />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}
