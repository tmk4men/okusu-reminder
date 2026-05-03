import { motion } from 'framer-motion'
import { BookOpen, Heart, X, Sparkles, Shield } from 'lucide-react'

interface Props {
  onClose: () => void
  onOpenHowTo: () => void
  onOpenJourney: () => void
}

export function MenuDrawer({ onClose, onOpenHowTo, onOpenJourney }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 38 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-0 top-0 h-full w-72 max-w-[80%] border-l border-ink-700 bg-ink-800 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-5 py-3">
          <h2 className="text-sm font-medium text-ink-200">メニュー</h2>
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={20} />
          </button>
        </div>

        <ul className="py-2">
          <li>
            <button
              onClick={() => {
                onOpenJourney()
                onClose()
              }}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-ink-100 active:bg-ink-700"
            >
              <Sparkles size={18} className="text-coral-500" />
              <span>あなたのあゆみ</span>
            </button>
          </li>
          <li>
            <button
              onClick={() => {
                onOpenHowTo()
                onClose()
              }}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-ink-100 active:bg-ink-700"
            >
              <BookOpen size={18} className="text-mint-500" />
              <span>使い方</span>
            </button>
          </li>
          <li>
            <a
              href="https://okusu-reminder.vercel.app/privacy.html"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-ink-100 active:bg-ink-700"
            >
              <Shield size={18} className="text-ink-300" />
              <span>プライバシーポリシー</span>
            </a>
          </li>
        </ul>

        <div className="absolute inset-x-0 bottom-0 border-t border-ink-700 px-5 py-4 text-center text-xs text-ink-400">
          <p className="inline-flex items-center gap-1">
            <Heart size={12} /> おくすリマインダー v0.4
          </p>
          <p className="mt-1">by tmk4men</p>
        </div>
      </motion.aside>
    </motion.div>
  )
}
