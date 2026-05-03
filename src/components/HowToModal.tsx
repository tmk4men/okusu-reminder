import { motion } from 'framer-motion'
import { X, Check, Clock, Bell, Calendar, Flame, Pill } from 'lucide-react'

interface Step {
  Icon: typeof Check
  title: string
  body: string
  accent: string
}

const STEPS: Step[] = [
  {
    Icon: Pill,
    title: 'おくすりを登録',
    body: '「おくすり」タブの＋から、薬やサプリを追加します。なまえ・1回あたり・色・スケジュールだけでOK。',
    accent: 'text-coral-500',
  },
  {
    Icon: Clock,
    title: '時刻 or 食事から逆算',
    body: '「8:00」のような定刻と、「朝食後30分」のような食事相対の両方が選べます。食事の時刻は設定タブで登録。',
    accent: 'text-mint-500',
  },
  {
    Icon: Check,
    title: 'のんだら緑のチェックを',
    body: '「のんだ？」と表示されたカードのチェックを押すだけ。記録された時刻も残るので「飲んだっけ？」と迷いません。',
    accent: 'text-mint-500',
  },
  {
    Icon: Bell,
    title: '通知でお知らせ',
    body: '設定タブで通知を有効にすると、予定時刻にお知らせが届きます。「あとで」を押すと10分後に再通知。',
    accent: 'text-coral-500',
  },
  {
    Icon: Flame,
    title: '続けるとあしあとが育つ',
    body: 'のんだ日が続くとストリーク（連続記録）がのびます。下のミニカレンダーをタップで月別の達成度も確認。',
    accent: 'text-coral-500',
  },
  {
    Icon: Calendar,
    title: 'データは端末に保存',
    body: 'ログインなし。データはこの端末のブラウザ内（IndexedDB）にだけ保存されます。プライバシー安心。',
    accent: 'text-mint-500',
  },
]

interface Props {
  onClose: () => void
}

export function HowToModal({ onClose }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[88svh] max-w-md overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-800 pb-[calc(env(safe-area-inset-bottom)+24px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-800/95 px-5 py-3 backdrop-blur">
          <span className="w-6" />
          <h2 className="text-base font-medium text-ink-50">使い方</h2>
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 pt-6">
          <p className="mb-6 text-sm text-ink-300">
            飲み忘れと「飲んだっけ？」を、ワンタップで終わらせるアプリです。
          </p>
          <ol className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex gap-3"
              >
                <div className="flex shrink-0 flex-col items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-ink-700 bg-ink-900">
                    <s.Icon size={18} className={s.accent} />
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-ink-700" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="font-medium text-ink-50">
                    <span className="mr-2 text-xs text-ink-400">{i + 1}</span>
                    {s.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-300">{s.body}</p>
                </div>
              </motion.li>
            ))}
          </ol>

          <div className="mt-8 rounded-2xl border border-ink-700 bg-ink-900 p-4 text-center">
            <p className="text-sm text-ink-200">
              ホーム画面に追加すると、アプリのように使えます
            </p>
            <p className="mt-1 text-[11px] text-ink-400">
              （Chrome/Safariのメニューから「ホーム画面に追加」）
            </p>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-full bg-mint-400 py-3 text-base font-medium text-ink-50"
          >
            はじめる
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
