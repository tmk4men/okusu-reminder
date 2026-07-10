# iOS リリース手順（おくすリマインダー）

Android と同じコードベース（Capacitor 8）から iOS アプリを出すための手順。
**Mac のターミナル + Xcode + App Store Connect だけ**で完結する。

- Bundle ID: `com.tmk4men.okusureminder`（Android と同一・変更不要）
- アプリ名: おくすリマインダー
- **AdMob 広告は iOS では最初オフ**（審査を通しやすくするため）。ONにする手順は末尾。

---

## 0. 一度だけ：Apple 側の準備

- Apple Developer Program（$99/年）に加入済みであること（課金済みとのこと）。
- App Store Connect で **新規アプリ**を作成しておく（後述の 3-5 でもOK）。

## 1. Mac にコードを持ってくる

```bash
git clone https://github.com/tmk4men/okusu-reminder.git
cd okusu-reminder
```

（既に clone 済みなら `git pull` で最新化）

## 2. セットアップスクリプトを実行（これ1発）

```bash
./ios-setup.sh
```

スクリプトが自動でやること:

1. `npm ci` で依存インストール
2. `npm run build` で Web ビルド
3. `npx cap add ios` で **iOS プロジェクト生成**（CocoaPods も自動）
4. `npx @capacitor/assets generate --ios` で **アイコン・スプラッシュを一括生成**
   （元画像は `assets/icon.png` 1024×1024。手動でアイコンを入れる必要なし）
5. `npx cap sync ios` → `npx cap open ios` で **Xcode が開く**

> CocoaPods が未インストールの場合はスクリプトが `sudo gem install cocoapods` を促す。

## 3. Xcode で署名（初回のみ設定）

Xcode が開いたら:

1. 左ペインで **App** プロジェクトを選択
2. **Signing & Capabilities** タブ
3. **Automatically manage signing** にチェック
4. **Team** に自分の Apple Developer アカウントを選択
5. Bundle Identifier が `com.tmk4men.okusureminder` になっていることを確認

## 4. アーカイブ & アップロード

1. 上部のデバイス選択を **Any iOS Device (arm64)** にする
2. メニュー **Product > Archive**
3. 完了すると **Organizer** が開く → **Distribute App**
4. **App Store Connect** → **Upload** を選んで進む（自動署名でOK）

コマンド派なら Xcode の代わりにこれでもよい:

```bash
# アーカイブ
xcodebuild -workspace ios/App/App.xcworkspace -scheme App \
  -configuration Release -archivePath build/App.xcarchive archive
# App Store へアップロード（ExportOptions.plist が必要）
xcodebuild -exportArchive -archivePath build/App.xcarchive \
  -exportOptionsPlist ExportOptions.plist -exportPath build/
```

（初回は Xcode GUI の方が署名まわりで詰まりにくいのでおすすめ）

## 5. App Store Connect で審査提出

<https://appstoreconnect.apple.com> にて:

1. マイApp → 新規App（未作成なら）
   - プラットフォーム: iOS / 名前: おくすリマインダー / Bundle ID: 上記
2. アップロードしたビルドが「TestFlight / ビルド」に出るまで数分〜十数分待つ
3. スクリーンショット・説明文・**プライバシー情報**を入力
   - プライバシーポリシー URL: `https://okusu-reminder.vercel.app/privacy.html`
   - データ収集: **なし**（端末内完結）
   - カテゴリ: メディカル / 対象年齢: 4+ 〜 12+ 目安
4. ビルドを選択して **審査に提出**

---

## 補足：課金（買い切り ¥480）を iOS で有効にする

コードは `@capgo/native-purchases`（StoreKit）で iOS 対応済み。ただし
App Store Connect 側で商品を作らないと購入は失敗する（アプリは落ちない）。

1. App Store Connect → 対象App → **App内課金** → **管理**
2. **非消耗型**を新規作成
   - 製品ID: `premium_lifetime`（コードと一致必須）
   - 価格: ¥500
3. 審査用のメタ情報を入れて、アプリ本体と一緒に審査提出

商品未作成でも「購入」ボタンはエラーメッセージを出すだけで、アプリは正常動作する。

---

## 補足：後から iOS で AdMob 広告をONにする

最初はオフ。ONにするには:

1. AdMob 管理画面で **iOS 用アプリ**を新規作成し、iOS の App ID と
   バナー広告ユニット ID を発行
2. `ios/App/App/Info.plist` に以下を追加
   - `GADApplicationIdentifier` = iOS 用 AdMob App ID（`ca-app-pub-XXXX~YYYY`）
   - `SKAdNetworkItems`（AdMob 公式ドキュメントの一覧をコピー）
3. iOS 用バナー ID を環境変数へ（Android とは別 ID）
4. `src/components/AdBanner.tsx` の
   ```ts
   const ADS_ENABLED_IOS = false
   ```
   を `true` に変更
5. `npm run build && npx cap sync ios` して再アーカイブ

> `ADS_ENABLED_IOS = false` の間は `AdMob.initialize` を一切呼ばないので、
> Info.plist に AdMob 設定が無くてもクラッシュしない。

---

## トラブル時

- **`pod install` で失敗**: `sudo gem install cocoapods`、または `brew install cocoapods`
- **署名エラー**: Xcode > Settings > Accounts に Apple ID を追加し直す
- **ビルドが古い**: `git pull` → `npm run build` → `npx cap sync ios` を再実行
- **Web の変更を反映したい**: `npm run build && npx cap sync ios`（`ios-setup.sh` 再実行でも可）
