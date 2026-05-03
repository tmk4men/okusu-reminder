# おくすリマインダー

公開: **https://okusu-reminder.vercel.app**

薬・サプリの飲み忘れと「飲んだっけ？」を防ぐ、シンプルな服薬リマインダー。

- 「のんだ？」にワンタップで答えるだけ
- 定刻 / 食事相対（食後30分など）の両方に対応
- 連続記録・キャラ育成（コウテイペンギンのヒナ「のんちゃん」）・バッジ
- データは端末のみ（IndexedDB）
- PWA インストール対応 / Web通知 / ネイティブ通知（Android）

## ロードマップ

- [x] Web版（Vite + React + TS + Tailwind v4 + Dexie）
- [x] PWA化（オフライン対応 / ホーム画面追加）
- [x] 通知（Web 暫定版 + ネイティブ実装）
- [x] キャラ育成 + バッジコレクション
- [x] オンボーディング
- [x] Capacitor で Android 梱包
- [ ] Android ホーム画面ウィジェット（Kotlin 別実装）
- [ ] Google Play 公開

## Web開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 本番ビルド
```

## Android（Capacitor）

### 必要環境

- **Android Studio**（最新版、Embedded JDK 17 同梱）
- 実機（USBデバッグ有効）または Android Emulator

### 初回セットアップ

1. Android Studio を起動
2. **Open** →
   `C:\Users\tomok\OneDrive\デスクトップ\おくすリマインダー\android`
   を開く
3. 自動で Gradle Sync が走る（初回は数分）
4. ▶ **Run 'app'** で実機 or エミュレータで起動

### Web 側の変更を Android に反映

```bash
npm run build && npx cap sync android
```

その後 Android Studio 側で再実行。

### APK ビルド（デバッグ）

```
Build → Build Bundle(s)/APK(s) → Build APK(s)
```

出力先: `android/app/build/outputs/apk/debug/app-debug.apk`

### リリースビルド（署名済み AAB / APK）

```
Build → Generate Signed Bundle/APK → AAB（Play 推奨）
```

初回はキーストア作成 → 以降同じものを使う。

## 技術スタック

- **Web**: Vite 8 / React 19 / TypeScript / Tailwind CSS v4
- **データ**: Dexie (IndexedDB) + dexie-react-hooks
- **演出**: Framer Motion / canvas-confetti / lucide-react
- **キャラ画像**: ChatGPT 生成（コウテイペンギンのヒナ）
- **モバイル**: Capacitor 8（Android）
  - @capacitor/local-notifications（OS スケジュール通知）
  - @capacitor/haptics
  - @capacitor/status-bar
  - @capacitor/splash-screen
