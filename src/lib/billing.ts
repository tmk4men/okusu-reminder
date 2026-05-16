import { NativePurchases, PURCHASE_TYPE } from '@capgo/native-purchases'
import { setPremium } from './premium'
import { isNative } from './platform'

export const PREMIUM_PRODUCT_ID = 'premium_lifetime'

export type BillingResult =
  | { ok: true }
  | { ok: false; code: 'unsupported' | 'not_native' | 'cancelled' | 'already_owned' | 'no_purchases' | 'unknown'; message: string }

function classifyError(err: unknown): BillingResult {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('cancel') || lower.includes('user_canceled') || lower.includes('1 ')) {
    return { ok: false, code: 'cancelled', message: '購入をキャンセルしました' }
  }
  if (lower.includes('already')) {
    return { ok: false, code: 'already_owned', message: '既にご購入済みです。「購入を復元」をお試しください' }
  }
  return { ok: false, code: 'unknown', message: '購入処理に失敗しました。時間をおいて再度お試しください' }
}

export async function purchasePremium(): Promise<BillingResult> {
  if (!isNative()) return { ok: false, code: 'not_native', message: 'Web版では購入できません' }
  try {
    const supported = await NativePurchases.isBillingSupported()
    if (!supported.isBillingSupported) {
      return { ok: false, code: 'unsupported', message: 'この端末では購入機能がご利用になれません' }
    }
    const tx = await NativePurchases.purchaseProduct({
      productIdentifier: PREMIUM_PRODUCT_ID,
      productType: PURCHASE_TYPE.INAPP,
    })
    // Android: purchaseState "1" が完了。autoAcknowledgePurchases はデフォルト true
    if (tx.purchaseState && tx.purchaseState !== '1') {
      return { ok: false, code: 'unknown', message: '購入が保留中です。決済完了後に有効になります' }
    }
    await setPremium(true)
    return { ok: true }
  } catch (e) {
    return classifyError(e)
  }
}

export async function restorePremium(): Promise<BillingResult> {
  if (!isNative()) return { ok: false, code: 'not_native', message: 'Web版では購入はありません' }
  try {
    await NativePurchases.restorePurchases()
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })
    const owned = purchases.some(
      (p) => p.productIdentifier === PREMIUM_PRODUCT_ID && (!p.purchaseState || p.purchaseState === '1'),
    )
    if (!owned) {
      return { ok: false, code: 'no_purchases', message: '復元できる購入が見つかりませんでした' }
    }
    await setPremium(true)
    return { ok: true }
  } catch (e) {
    return classifyError(e)
  }
}

// 起動時に呼ぶ。購入済みなのにローカルフラグが false の場合（再インストール・機種変更後）に同期
export async function verifyPremiumOnLaunch(): Promise<void> {
  if (!isNative()) return
  try {
    const { purchases } = await NativePurchases.getPurchases({ productType: PURCHASE_TYPE.INAPP })
    const owned = purchases.some(
      (p) => p.productIdentifier === PREMIUM_PRODUCT_ID && (!p.purchaseState || p.purchaseState === '1'),
    )
    if (owned) await setPremium(true)
  } catch {
    // 起動時はサイレント。ネット未接続等で失敗してもUIには出さない
  }
}
