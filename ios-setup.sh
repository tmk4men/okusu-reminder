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

# --- 5. 同期して Xcode を開く -----------------------------------------------
info "Web と設定を iOS に同期（npx cap sync ios）"
npx cap sync ios
ok "同期完了"

info "Xcode を開きます"
npx cap open ios

cat <<'NEXT'

────────────────────────────────────────────────────────────
✓ セットアップ完了。あとは Xcode + App Store Connect だけ:

  1. Xcode 左ペインで "App" を選択 → Signing & Capabilities
     → Team に自分の Apple Developer アカウントを設定（自動署名）
  2. Bundle Identifier は com.tmk4men.okusureminder（変更不要）
  3. メニュー Product > Archive でアーカイブ
  4. Organizer が開いたら Distribute App
     → App Store Connect → Upload
  5. App Store Connect (https://appstoreconnect.apple.com) で
     新規アプリを作成し、ビルドを選択して審査提出

  ※ 広告は最初オフ。ONにする手順は IOS_RELEASE.md を参照。
────────────────────────────────────────────────────────────
NEXT
