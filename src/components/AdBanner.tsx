import { useEffect, useState } from 'react'
import {
  AdMob,
  BannerAdPosition,
  BannerAdSize,
  BannerAdPluginEvents,
  type AdMobError,
} from '@capacitor-community/admob'
import { usePremium } from '../lib/premium'
import { isNative, platform } from '../lib/platform'

// Google 公式テストバナー（Android）。本番では VITE_ADMOB_BANNER_ID を .env で上書き
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'
const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || TEST_BANNER_ID

// iOS は広告オフでリリース開始。有効化する手順は IOS_RELEASE.md 参照
// （iOS 用 AdMob アプリ作成 → Info.plist の GADApplicationIdentifier を本番IDに差し替え
//   ＋ SKAdNetworkItems 追加 → ここを true → Podfile の AdMob 除去も戻す）
// ⚠️ 注意: このフラグは JS 側で initialize/showBanner を止めるだけ。以前は iOS ネイティブの
//   Google Mobile Ads SDK がリンクされたまま起動時に Info.plist を検証し、フラグが false でも
//   「起動時クラッシュ」していた（審査 2.1(a) 差し戻しの真因）。
//   → 現在は ios-setup.sh が iOS バイナリから AdMob SDK ごと除去するので原理的に落ちない
//     （このフラグを true にする時は ios-setup.sh の AdMob 除去処理も外すこと）。
const ADS_ENABLED_IOS = false

// この端末で広告を出してよいか（iOS はフラグがオフの間は常に非表示）
function adsAllowed(): boolean {
  if (!isNative()) return false
  if (platform() === 'ios' && !ADS_ENABLED_IOS) return false
  return true
}

// VITE_ADMOB_DEBUG=1 でビルドすると、実機に広告の読み込み状況を表示して原因切り分けできる
const DEBUG = import.meta.env.VITE_ADMOB_DEBUG === '1'

let initialized = false
async function ensureInitialized() {
  if (initialized) return
  initialized = true
  await AdMob.initialize({
    initializeForTesting: !import.meta.env.VITE_ADMOB_BANNER_ID,
  })
}

export function AdBanner() {
  const premium = usePremium()
  const [status, setStatus] = useState<string>('init…')

  useEffect(() => {
    // iOS で ADS_ENABLED_IOS が false の間は AdMob.initialize を一切呼ばない（SDK を起動させない）
    if (premium || !adsAllowed()) return
    let cancelled = false
    const handles: { remove: () => void }[] = []

    ;(async () => {
      try {
        const loaded = await AdMob.addListener(BannerAdPluginEvents.Loaded, () => {
          setStatus('loaded ✓')
        })
        const failed = await AdMob.addListener(
          BannerAdPluginEvents.FailedToLoad,
          (e: AdMobError) => {
            setStatus(`failed code=${e.code} ${e.message ?? ''}`)
          },
        )
        handles.push(loaded, failed)

        await ensureInitialized()
        if (cancelled) return
        setStatus('requesting…')
        await AdMob.showBanner({
          adId: BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 64,
        })
      } catch (e) {
        setStatus(`showBanner error: ${String(e)}`)
        console.warn('AdMob showBanner failed', e)
      }
    })()

    return () => {
      cancelled = true
      handles.forEach((h) => h.remove())
      AdMob.removeBanner().catch(() => {})
    }
  }, [premium])

  // DEBUG ストリップは premium でも表示する（広告が出ない原因の切り分けのため）
  if (DEBUG && isNative()) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[120px] z-30 mx-auto max-w-md px-3">
        <div className="rounded-lg border border-dashed border-amber-500/60 bg-ink-900/90 py-1.5 text-center text-[10px] tracking-wide text-amber-300">
          AD: {premium ? 'premium → 広告非表示' : status}
        </div>
      </div>
    )
  }

  if (premium) return null

  if (import.meta.env.DEV && !isNative()) {
    return (
      <div className="pointer-events-none fixed inset-x-0 bottom-[64px] z-10 mx-auto max-w-md px-3">
        <div className="rounded-lg border border-dashed border-ink-600 bg-ink-800/60 py-2 text-center text-[10px] uppercase tracking-widest text-ink-400">
          ad banner (dev)
        </div>
      </div>
    )
  }

  return null
}
