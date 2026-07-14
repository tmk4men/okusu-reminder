#!/usr/bin/env bash
#
# おくすリマインダー iOS セットアップ（Mac 専用・1コマンド）
#
# 使い方（ターミナルで）:
#   git clone https://github.com/tmk4men/okusu-reminder.git
#   cd okusu-reminder
#   ./ios-setup.sh
#
# これ 1 発で:
#   1. 依存インストール（npm）
#   2. Web ビルド（dist/ 生成）
#   3. iOS プロジェクト生成（ios/ ＋ CocoaPods）
#   4. アイコン・スプラッシュを assets/ から自動生成
#   5. Xcode で App.xcworkspace を開く
#
# ※ AdMob 広告は iOS では最初オフ（IOS_RELEASE.md 参照）。
#
set -euo pipefail

cd "$(dirname "$0")"

info() { printf '\033[1;36m▶ %s\033[0m\n' "$1"; }
ok()   { printf '\033[1;32m✓ %s\033[0m\n' "$1"; }
die()  { printf '\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# --- 前提チェック -----------------------------------------------------------
[ "$(uname)" = "Darwin" ] || die "このスクリプトは Mac 専用です（iOS ビルドには macOS + Xcode が必須）。"
command -v node >/dev/null 2>&1 || die "Node.js が見つかりません。https://nodejs.org からインストールしてください。"
command -v xcodebuild >/dev/null 2>&1 || die "Xcode が見つかりません。App Store から Xcode を入れて一度起動し、ライセンスに同意してください。"

if ! command -v pod >/dev/null 2>&1; then
  info "CocoaPods が無いのでインストールします（sudo パスワードを求められます）"
  sudo gem install cocoapods || die "CocoaPods のインストールに失敗しました。'brew install cocoapods' もお試しください。"
fi
ok "前提ツール OK（macOS / Node / Xcode / CocoaPods）"

# --- 1. 依存インストール ----------------------------------------------------
info "依存パッケージをインストール（npm ci）"
if [ -f package-lock.json ]; then npm ci; else npm install; fi
ok "依存インストール完了"

# --- 2. Web ビルド ----------------------------------------------------------
info "Web をビルド（dist/ 生成）"
npm run build
ok "Web ビルド完了"

# --- 3. iOS プロジェクト生成 ------------------------------------------------
if [ ! -d ios ]; then
  info "iOS プロジェクトを新規生成（npx cap add ios）"
  npx cap add ios
  ok "ios/ を生成しました"
else
  ok "ios/ は既に存在（生成をスキップ）"
fi

# --- 4. アイコン・スプラッシュ生成 ------------------------------------------
info "アイコン・スプラッシュを assets/ から生成（AppIcon 全サイズ）"
npx @capacitor/assets generate --ios
ok "アイコン生成完了（ios/App/App/Assets.xcassets に反映）"

# --- 4.5 Info.plist に GADApplicationIdentifier を注入（保険）----------------
# ⚠️ 起動クラッシュの真因: 広告が iOS でオフ（ADS_ENABLED_IOS=false）でも、
#   @capacitor-community/admob の Google Mobile Ads SDK がバイナリに静的リンクされ、
#   その SDK が起動直後にバックグラウンドキューで Info.plist を検証し、無いと
#   GADInvalidInitializationException を投げて「起動直後にクラッシュ」していた
#   （JS の広告オフ判定より前に落ちるので防げない。審査 2.1(a) 差し戻し原因）。
#   → 根本対策は下の「5.5」で SDK ごと iOS から除去する（キー注入だけでは
#     build 4〜6 で止まらなかったため）。ここでのキー注入は、将来うっかり
#     SDK を戻した時に落ちないための保険（あっても広告は出ない・無害）。
#   将来 iOS 広告を ON にする時だけ、本物の iOS 用 AdMob App ID に差し替える。
PLIST="ios/App/App/Info.plist"
GAD_ID="ca-app-pub-3940256099942544~1458002511"
if [ -f "$PLIST" ]; then
  if /usr/libexec/PlistBuddy -c "Print :GADApplicationIdentifier" "$PLIST" >/dev/null 2>&1; then
    ok "GADApplicationIdentifier は設定済み（起動クラッシュ対策 OK）"
  else
    /usr/libexec/PlistBuddy -c "Add :GADApplicationIdentifier string $GAD_ID" "$PLIST"
    ok "GADApplicationIdentifier を Info.plist に追加（起動クラッシュ回避）"
  fi
else
  die "$PLIST が見つかりません（iOS プロジェクト生成に失敗？）"
fi

# 独自暗号を使っていない宣言（毎回の輸出コンプライアンス質問をスキップ・提出保留回避）
if /usr/libexec/PlistBuddy -c "Print :ITSAppUsesNonExemptEncryption" "$PLIST" >/dev/null 2>&1; then
  ok "ITSAppUsesNonExemptEncryption は設定済み"
else
  /usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$PLIST"
  ok "ITSAppUsesNonExemptEncryption=false を追加（暗号化質問スキップ）"
fi

# iPhone 専用に固定（iPad 審査・iPad スクショ不要。v1 は iPhone のみ対応）
# Capacitor 既定は "1,2"（iPhone+iPad）。1 のみ = iPhone 専用。
PBXPROJ="ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$PBXPROJ" ]; then
  if grep -q 'TARGETED_DEVICE_FAMILY = 1;' "$PBXPROJ" && ! grep -q 'TARGETED_DEVICE_FAMILY = "1,2";' "$PBXPROJ"; then
    ok "TARGETED_DEVICE_FAMILY は iPhone 専用(1)に設定済み"
  else
    sed -i '' -E 's/TARGETED_DEVICE_FAMILY = [^;]*;/TARGETED_DEVICE_FAMILY = 1;/g' "$PBXPROJ"
    ok "TARGETED_DEVICE_FAMILY を 1（iPhone 専用）に設定"
  fi
else
  die "$PBXPROJ が見つかりません（iOS プロジェクト生成に失敗？）"
fi

# --- 5. 同期（Podfile 再生成 ＋ pod install）--------------------------------
info "Web と設定を iOS に同期（npx cap sync ios）"
npx cap sync ios
ok "同期完了"

# --- 5.5 ★起動クラッシュの根本対策：iOS から AdMob SDK を除去 ---------------
# 3件の起動クラッシュ(SIGABRT / GADInvalidInitializationException) の真因は、
# @capacitor-community/admob が Google-Mobile-Ads-SDK(12.x) を静的リンクし、
# その SDK が起動直後にバックグラウンドキューで Info.plist を検証して未捕捉の
# NSException を投げていたこと。iOS は広告オフ(ADS_ENABLED_IOS=false)で SDK を
# 一切使わないので、iOS バイナリからプラグインごと外せばクラッシュは原理的に起きない。
#   ※ Android は従来どおり AdMob を使用（ここは iOS の Podfile だけを編集）。
#   ※ cap sync は Podfile の "def capacitor_pods 〜 end" の中身だけを毎回再生成
#     するため、この除去は必ず sync の後に行う（先に消しても sync で復活する）。
PODFILE="ios/App/Podfile"
if [ -f "$PODFILE" ]; then
  if grep -q "CapacitorCommunityAdmob" "$PODFILE"; then
    sed -i '' '/CapacitorCommunityAdmob/d' "$PODFILE"
    info "iOS の Podfile から AdMob を除去 → pod install で再リンク"
    ( cd ios/App && pod install )
    ok "AdMob(Google-Mobile-Ads-SDK) を iOS バイナリから除去"
  else
    ok "AdMob は既に iOS Podfile から除去済み"
  fi
else
  die "$PODFILE が見つかりません（cap sync に失敗？）"
fi

# --- 5.6 最終検証：クラッシュ要因が本当に消えたか（Mac 上で即フィードバック）--
if [ -f ios/App/Podfile.lock ] && grep -qi "Google-Mobile-Ads-SDK" ios/App/Podfile.lock; then
  die "Google-Mobile-Ads-SDK がまだ iOS にリンクされています。起動クラッシュが再発します。ios/App/Podfile を確認して pod install し直してください。"
fi
ok "検証OK: Google-Mobile-Ads-SDK は iOS に非リンク（起動クラッシュの真因を除去）"
if /usr/libexec/PlistBuddy -c "Print :GADApplicationIdentifier" "$PLIST" >/dev/null 2>&1; then
  ok "検証OK: GADApplicationIdentifier も設定済み（万一 SDK を戻しても落ちない保険）"
fi

info "Xcode を開きます"
npx cap open ios

cat <<'NEXT'

────────────────────────────────────────────────────────────
✓ セットアップ完了。あとは Xcode + App Store Connect だけ:

  0. ★ビルド番号を上げる（再提出は必須。前回 build 6 が起動クラッシュで審査落ち）:
       cd ios/App && xcrun agvtool new-version -all 7 && cd -
  1. Xcode 左ペインで "App" を選択 → Signing & Capabilities
     → Team に自分の Apple Developer アカウントを設定（自動署名）
  2. Bundle Identifier は com.tmk4men.okusureminder（変更不要）
  3. メニュー Product > Archive でアーカイブ
  4. Organizer が開いたら Distribute App
     → App Store Connect → Upload
  5. App Store Connect (https://appstoreconnect.apple.com) で
     ビルドを選択して審査に再提出

  ※ ★起動クラッシュ(審査 2.1(a))の真因＝iOS に静的リンクされた Google Mobile
    Ads SDK が起動時に投げる例外。本スクリプトが iOS バイナリから AdMob ごと
    除去済み（上の「検証OK」を確認）。GADApplicationIdentifier 注入は保険。
  ※ 広告は iOS ではオフ（Android は従来どおり）。ONにする手順は IOS_RELEASE.md。
  ※ Web 変更を反映する時は素の "npx cap sync ios" ではなく必ず ./ios-setup.sh を
    再実行する（sync 単独だと AdMob が Podfile に復活し、クラッシュが再発する）。
────────────────────────────────────────────────────────────
NEXT
