import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { Layout } from './components/Layout'
import { Today } from './components/Today'
import { Medications } from './components/Medications'
import { Settings } from './components/Settings'
import { Onboarding, isOnboarded } from './components/Onboarding'
import { db } from './db/schema'
import { rescheduleToday, snoozeSchedule, setupNotificationActions } from './lib/notify'
import { todayKey } from './lib/date'

export type Tab = 'today' | 'meds' | 'settings'

const TAB_ORDER: Tab[] = ['today', 'meds', 'settings']

const tabVariants = {
  enter: (d: number) => ({ opacity: 0, x: d === 0 ? 0 : d * 24 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d === 0 ? 0 : d * -24 }),
}

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
  const [direction, setDirection] = useState(0)
  const [onboarding, setOnboarding] = useState(() => !isOnboarded())

  function changeTab(next: Tab) {
    setDirection(Math.sign(TAB_ORDER.indexOf(next) - TAB_ORDER.indexOf(tab)))
    setTab(next)
  }

  const meds = useLiveQuery(() => db.medications.toArray())
  const schedules = useLiveQuery(() => db.schedules.toArray())
  const settings = useLiveQuery(() => db.settings.toArray())
  const todayLogs = useLiveQuery(() => db.logs.where('date').equals(todayKey()).toArray())
  const snoozes = useLiveQuery(() => db.snoozes.toArray())

  useEffect(() => {
    setupNotificationActions().catch(() => {})
  }, [])

  useEffect(() => {
    rescheduleToday()
  }, [meds, schedules, settings, todayLogs, snoozes])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const take = params.get('take')
    const later = params.get('later')
    if (take) {
      db.logs.add({
        scheduleId: Number(take),
        date: todayKey(),
        status: 'taken',
        recordedAt: Date.now(),
      })
    }
    if (later) {
      snoozeSchedule(Number(later))
    }
    if (take || later) history.replaceState({}, '', '/')
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const handler = (e: MessageEvent) => {
      const msg = e.data
      if (msg?.type !== 'notification-action') return
      const { action, data } = msg
      if (!data?.scheduleId) return
      if (action === 'taken') {
        db.logs.add({
          scheduleId: data.scheduleId,
          date: data.dateKey || todayKey(),
          status: 'taken',
          recordedAt: Date.now(),
        })
      } else if (action === 'later') {
        snoozeSchedule(data.scheduleId)
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
    <>
      <Layout active={tab} onChange={changeTab}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={tab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18 }}
          >
            {tab === 'today' && <Today />}
            {tab === 'meds' && <Medications />}
            {tab === 'settings' && <Settings />}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <AnimatePresence>
        {onboarding && <Onboarding onComplete={() => setOnboarding(false)} />}
      </AnimatePresence>
    </>
  )
}
