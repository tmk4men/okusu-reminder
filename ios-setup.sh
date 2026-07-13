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

# --- 4.5 Info.plist に GADApplicationIdentifier を注入（起動クラッシュ回避）---
# ⚠️ 重要: 広告が iOS でオフ（ADS_ENABLED_IOS=false）でも、@capacitor-community/admob の
#   Google Mobile Ads SDK はバイナリにリンクされる。この SDK は起動時に Info.plist の
#   GADApplicationIdentifier を検証し、無いと GADInvalidInitializationException で
#   「起動直後にクラッシュ」する（JS の広告オフ判定より前に落ちるので防げない）。
#   → App Store 審査 2.1(a) の「起動時クラッシュ」差し戻しの原因。必ずキーを入れる。
#   値は AdMob iOS テスト用 App ID。initialize を呼ばないので広告は出ない（起動チェック通過用）。
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

# --- 5. 同期して Xcode を開く -----------------------------------------------
info "Web と設定を iOS に同期（npx cap sync ios）"
npx cap sync ios
ok "同期完了"

info "Xcode を開きます"
npx cap open ios

cat <<'NEXT'

────────────────────────────────────────────────────────────
✓ セットアップ完了。あとは Xcode + App Store Connect だけ:

  0. ★ビルド番号を上げる（再提出は必須。前回 build 3 が審査落ち）:
       cd ios/App && xcrun agvtool new-version -all 4 && cd -
  1. Xcode 左ペインで "App" を選択 → Signing & Capabilities
     → Team に自分の Apple Developer アカウントを設定（自動署名）
  2. Bundle Identifier は com.tmk4men.okusureminder（変更不要）
  3. メニュー Product > Archive でアーカイブ
  4. Organizer が開いたら Distribute App
     → App Store Connect → Upload
  5. App Store Connect (https://appstoreconnect.apple.com) で
     ビルドを選択して審査に再提出

  ※ Info.plist の GADApplicationIdentifier は本スクリプトが自動注入済み
    （無いと Google Mobile Ads SDK が起動時にクラッシュ＝今回の審査落ち原因）。
  ※ 広告は最初オフ。ONにする手順は IOS_RELEASE.md を参照。
────────────────────────────────────────────────────────────
NEXT
