import { motion } from 'framer-motion'
import { CalendarCheck, Pill, Settings as SettingsIcon } from 'lucide-react'
import type { Tab } from '../App'

interface Props {
  active: Tab
  onChange: (t: Tab) => void
  children: React.ReactNode
}

const TABS: { id: Tab; label: string; Icon: typeof Pill }[] = [
  { id: 'today', label: '今日', Icon: CalendarCheck },
  { id: 'meds', label: 'おくすり', Icon: Pill },
  { id: 'settings', label: '設定', Icon: SettingsIcon },
]

export function Layout({ active, onChange, children }: Props) {
  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-ink-900">
      <main className="flex-1 overflow-y-auto pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-ink-700 bg-ink-900/95 backdrop-blur">
        <ul className="flex">
          {TABS.map(({ id, label, Icon }) => {
            const on = active === id
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  className="relative flex w-full flex-col items-center gap-1 py-3 text-xs"
                >
                  {on && (
                    <motion.span
                      layoutId="tabIndicator"
                      className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-mint-400"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    className={on ? 'text-mint-400' : 'text-ink-300'}
                    strokeWidth={on ? 2.4 : 1.8}
                  />
                  <span className={on ? 'text-ink-50' : 'text-ink-300'}>{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}
