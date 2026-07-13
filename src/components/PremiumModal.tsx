import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Check, Sparkles, ShieldOff, Loader2, Infinity as InfinityIcon } from 'lucide-react'
import { setPremium } from '../lib/premium'
import { isNative, platform } from '../lib/platform'
import { purchasePremium, restorePremium, type PremiumPlan } from '../lib/billing'

interface Props {
  onClose: () => void
  reason?: 'limit' | 'manual'
}

const TERMS_URL = 'https://okusu-reminder.vercel.app/terms.html'
const PRIVACY_URL = 'https://okusu-reminder.vercel.app/privacy.html'

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
    body: '追加スキンや履歴出力など、これから増える有料機能が使えます。',
  },
]

type PlanOpt = {
  id: PremiumPlan
  title: string
  price: string
  unit: string
  sub: string
  badge?: string
}

const PLANS: PlanOpt[] = [
  { id: 'monthly', title: '月額プラン', price: '¥300', unit: '/月', sub: 'いつでも解約OK・自動更新' },
  {
    id: 'lifetime',
    title: '買い切りプラン',
    price: '¥500',
    unit: '一度きり',
    sub: '継続課金なし・ずっと使える',
    badge: 'おすすめ',
  },
]

export function PremiumModal({ onClose, reason = 'manual' }: Props) {
  const [plan, setPlan] = useState<PremiumPlan>('lifetime')
  const [busyAction, setBusyAction] = useState<'purchase' | 'restore' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const busy = busyAction !== null

  const store = platform() === 'ios' ? 'Apple ID' : 'Google Play アカウント'
  const cancelPath =
    platform() === 'ios'
      ? '「設定」→ Apple ID →「サブスクリプション」'
      : 'Google Play →「お支払いと定期購入」'

  async function handlePurchase() {
    setBusyAction('purchase')
    setError(null)
    if (!isNative()) {
      // Web/dev では即時解放してフロー確認のみ
      await setPremium(true)
      onClose()
      return
    }
    const result = await purchasePremium(plan)
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
      setBusyAction(null)
    }
  }

  async function handleRestore() {
    setBusyAction('restore')
    setError(null)
    if (!isNative()) {
      setError('Web版では購入はありません')
      setBusyAction(null)
      return
    }
    const result = await restorePremium()
    if (result.ok) {
      onClose()
    } else {
      setError(result.message)
      setBusyAction(null)
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

          <p className="mb-3 text-center text-sm text-ink-300">お好きなプランを選べます</p>

          {/* プラン選択 */}
          <div className="space-y-3">
            {PLANS.map((p) => {
              const selected = plan === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  aria-pressed={selected}
                  className={`relative flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? 'border-mint-400 bg-mint-400/10 ring-1 ring-mint-400'
                      : 'border-ink-700 bg-ink-900'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-ink-50">{p.title}</span>
                      {p.badge && (
                        <span className="rounded-full bg-mint-400 px-2 py-0.5 text-[10px] font-medium text-ink-900">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-300">{p.sub}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xl font-semibold text-ink-50">{p.price}</span>
                    <span className="ml-0.5 text-xs text-ink-300">{p.unit}</span>
                  </div>
                  <span
                    className={`absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full border ${
                      selected ? 'border-mint-400 bg-mint-400' : 'border-ink-600'
                    }`}
                  >
                    {selected && <Check size={11} strokeWidth={3} className="text-ink-900" />}
                  </span>
                </button>
              )
            })}
          </div>

          <ul className="mt-6 space-y-4">
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
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-mint-400 py-3 text-base font-medium text-ink-50 disabled:opacity-70"
          >
            {busyAction === 'purchase' ? (
              <>
                <Loader2 size={18} strokeWidth={2.6} className="animate-spin" />
                処理中…
              </>
            ) : (
              <>
                <Check size={18} strokeWidth={2.6} />
                {plan === 'monthly' ? '月額プランを開始' : '買い切りで購入'}
              </>
            )}
          </button>
          <button
            onClick={handleRestore}
            disabled={busy}
            className="mt-2 inline-flex w-full items-center justify-center gap-1.5 py-2 text-xs text-ink-400 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {busyAction === 'restore' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                確認中…
              </>
            ) : (
              '購入を復元'
            )}
          </button>

          {/* 課金の開示（自動更新の条件・規約リンク）— App Store ガイドライン 3.1.2 準拠 */}
          <div className="mt-4 space-y-2 text-[11px] leading-relaxed text-ink-400">
            {plan === 'monthly' ? (
              <p>
                月額プランは自動更新サブスクリプションです。お支払いは購入確定時に{store}に請求され、
                期間終了の24時間前までに解約しない限り ¥300/月 で自動更新されます。解約は{cancelPath}
                からいつでも行えます。
              </p>
            ) : (
              <p>
                買い切りプランは一度のお支払いのみで、継続課金はありません。購入は{store}に紐づき、
                同じアカウントの他端末でも「購入を復元」から引き継げます。
              </p>
            )}
            <p>
              <a href={TERMS_URL} target="_blank" rel="noreferrer" className="underline">
                利用規約
              </a>
              <span className="mx-1">・</span>
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer" className="underline">
                プライバシーポリシー
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
