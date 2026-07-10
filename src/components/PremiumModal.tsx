import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Sparkles, ShieldOff, Infinity as InfinityIcon } from 'lucide-react'
import { setPremium } from '../lib/premium'
import { isNative } from '../lib/platform'
import { purchasePremium, restorePremium } from '../lib/billing'

interface Props {
  onClose: () => void
  reason?: 'limit' | 'manual'
}

const PERKS = [
  {
    Icon: InfinityIcon,
    title: 'おくすり登録 無制限',
    body: '無料版は3個まで。プレミアムなら何個でも登録できます。',
  },
  {
    Icon: ShieldOff,
    title: '広告を非表示',
    body: 'バナー広告がすべて消えて、すっきり使えます。',
  },
  {
    Icon: Sparkles,
    title: '今後の新機能も含まれます',
    body: '追加スキンや履歴出力など、これから増える有料機能が一度の購入で利用できます。',
  },
]

export function PremiumModal({ onClose, reason = 'manual' }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePurchase() {
    setBusy(true)
    setError(null)
    if (!isNative()) {
      // Web/dev では即時解放してフロー確認のみ
      await setPremium(true)
      onClose()
      return
    }
    const result = await purchasePremium()
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
      setBusy(false)
    }
  }

  async function handleRestore() {
    setBusy(true)
    setError(null)
    if (!isNative()) {
      setError('Web版では購入はありません')
      setBusy(false)
      return
    }
    const result = await restorePremium()
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
      setBusy(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 36 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[90svh] max-w-md overflow-y-auto rounded-t-3xl border-t border-ink-700 bg-ink-800 pb-[calc(env(safe-area-inset-bottom)+24px)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ink-700 bg-ink-800/95 px-5 py-3 backdrop-blur">
          <span className="w-6" />
          <h2 className="text-base font-medium text-ink-50">プレミアム</h2>
          <button onClick={onClose} className="text-ink-300" aria-label="閉じる">
            <X size={22} />
          </button>
        </div>

        <div className="px-5 pt-6">
          {reason === 'limit' && (
            <div className="mb-4 rounded-2xl border border-coral-500/30 bg-coral-500/10 px-4 py-3 text-sm text-coral-200">
              無料版で登録できるおくすりは3個までです。
              プレミアムにすると無制限に登録できます。
            </div>
          )}

          <div className="mb-6 text-center">
            <p className="text-sm text-ink-300">一度の購入で、ずっと使える</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-ink-50">
              ¥500
              <span className="ml-1 text-sm font-normal text-ink-300">買い切り</span>
            </p>
          </div>

          <ul className="space-y-4">
            {PERKS.map((p) => (
              <li key={p.title} className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-700 bg-ink-900 text-mint-400">
                  <p.Icon size={18} />
                </div>
                <div>
                  <p className="font-medium text-ink-50">{p.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-300">{p.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {error && (
            <p className="mt-5 rounded-xl bg-ink-900 px-3 py-2 text-center text-xs text-coral-300">
              {error}
            </p>
          )}

          <button
            onClick={handlePurchase}
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mint-400 py-3 text-base font-medium text-ink-50 disabled:opacity-60"
          >
            <Check size={18} strokeWidth={2.6} />
            プレミアムを購入
          </button>
          <button
            onClick={handleRestore}
            disabled={busy}
            className="mt-2 w-full py-2 text-xs text-ink-400 underline-offset-2 hover:underline disabled:opacity-60"
          >
            購入を復元
          </button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-ink-400">
            購入はGoogle Playアカウントに紐づきます。同じアカウントの他端末でも利用できます。
          </p>
        </div>
      </motion.div>
    </motion.div>
  )
}
