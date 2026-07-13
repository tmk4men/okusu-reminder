import { NativePurchases, PURCHASE_TYPE, type Transaction } from '@capgo/native-purchases'
import { setPremium } from './premium'
import { isNative, platform } from './platform'

// 買い切り（非消耗型 ¥500）とサブスク（自動更新 ¥300/月）の2プラン。
// 製品IDは App Store Connect / Play Console の設定と完全一致必須。
export const PREMIUM_LIFETIME_ID = 'premium_lifetime'
export const PREMIUM_MONTHLY_ID = 'premium_monthly'
// Android のみ: Play Console のサブスク `premium_monthly` に作る「基本プラン」ID（コードと一致必須）。iOS では無視される。
const MONTHLY_ANDROID_BASE_PLAN = 'monthly'

export type PremiumPlan = 'lifetime' | 'monthly'

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

// getPurchases の結果から「今プレミアムが有効か」を判定する。
// 買い切り: 所有していれば恒久。サブスク: 有効期間内のみ（iOS は isActive、Android は
// getPurchases に載る＝有効な購入 purchaseState==='1'。失効・解約後は一覧から消える or false）。
function isEntitled(purchases: Transaction[]): boolean {
  return purchases.some((p) => {
    if (p.productIdentifier === PREMIUM_LIFETIME_ID) {
      // 非消耗型: iOS は currentEntitlements に載っていれば所有（purchaseState 無し）。Android は '1'。
      return p.purchaseState ? p.purchaseState === '1' : true
    }
    if (p.productIdentifier === PREMIUM_MONTHLY_ID) {
      if (typeof p.isActive === 'boolean') return p.isActive // iOS: 失効すると false
      return p.purchaseState ? p.purchaseState === '1' : true // Android
    }
    return false
  })
}

// iOS では onlyCurrentEntitlements:true で「現在有効な権利のみ」を取得（失効サブスクを除外・
// 別Apple IDの購入混入も防ぐ）。Android ではこのオプションは無視される。
async function fetchPurchases(): Promise<Transaction[]> {
  const { purchases } = await NativePurchases.getPurchases({ onlyCurrentEntitlements: true })
  return purchases
}

export async function purchasePremium(plan: PremiumPlan): Promise<BillingResult> {
  if (!isNative()) return { ok: false, code: 'not_native', message: 'Web版では購入できません' }
  try {
    const supported = await NativePurchases.isBillingSupported()
    if (!supported.isBillingSupported) {
      return { ok: false, code: 'unsupported', message: 'この端末では購入機能がご利用になれません' }
    }

    const tx =
      plan === 'monthly'
        ? await NativePurchases.purchaseProduct({
            productIdentifier: PREMIUM_MONTHLY_ID,
            productType: PURCHASE_TYPE.SUBS,
            // Android はサブスクの基本プランID指定が必須。iOS では無視される
            ...(platform() === 'android' ? { planIdentifier: MONTHLY_ANDROID_BASE_PLAN } : {}),
          })
        : await NativePurchases.purchaseProduct({
            productIdentifier: PREMIUM_LIFETIME_ID,
            productType: PURCHASE_TYPE.INAPP,
          })

    // Android: purchaseState "1" が完了。iOS は purchaseState 無し（成功時点で完了）
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
    const purchases = await fetchPurchases()
    if (!isEntitled(purchases)) {
      return { ok: false, code: 'no_purchases', message: '復元できる購入が見つかりませんでした' }
    }
    await setPremium(true)
    return { ok: true }
  } catch (e) {
    return classifyError(e)
  }
}

// 起動時に呼ぶ。買い切り／有効なサブスクがあれば true、どちらも無ければ false に同期する。
// サブスクを解約・失効した場合はここで false に戻る（＝プレミアム解除）。
// ネット未接続等で取得に失敗した時は現状維持（既存の権利を誤って剥奪しない）。
export async function verifyPremiumOnLaunch(): Promise<void> {
  if (!isNative()) return
  try {
    const purchases = await fetchPurchases()
    await setPremium(isEntitled(purchases))
  } catch {
    // 起動時はサイレント。取得失敗時はローカルの状態を維持
  }
}

// サブスクの管理・解約ページ（iOS: App Store / Android: Google Play）を開く
export async function openManageSubscriptions(): Promise<void> {
  if (!isNative()) return
  try {
    await NativePurchases.manageSubscriptions()
  } catch {
    // 開けない場合は無視（ユーザーは設定アプリから操作可能）
  }
}
