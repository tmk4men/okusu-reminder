import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Layout } from './components/Layout'
import { Today } from './components/Today'
import { Medications } from './components/Medications'
import { Settings } from './components/Settings'

export type Tab = 'today' | 'meds' | 'settings'

export default function App() {
  const [tab, setTab] = useState<Tab>('today')
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
