import { useEffect } from 'react'
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob'
import { usePremium } from '../lib/premium'
import { isNative } from '../lib/platform'

// Google 公式テストバナー（Android）。本番では VITE_ADMOB_BANNER_ID を .env で上書き
const TEST_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111'
const BANNER_ID = (import.meta.env.VITE_ADMOB_BANNER_ID as string | undefined) || TEST_BANNER_ID

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

  useEffect(() => {
    if (premium || !isNative()) return
    let cancelled = false
    ;(async () => {
      try {
        await ensureInitialized()
        if (cancelled) return
        await AdMob.showBanner({
          adId: BANNER_ID,
          adSize: BannerAdSize.ADAPTIVE_BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 64,
        })
      } catch (e) {
        console.warn('AdMob showBanner failed', e)
      }
    })()
    return () => {
      cancelled = true
      AdMob.removeBanner().catch(() => {})
    }
  }, [premium])

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
