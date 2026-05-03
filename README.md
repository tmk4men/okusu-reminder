# おくすリマインダー

薬・サプリの飲み忘れと「飲んだっけ？」を防ぐ、シンプルな服薬リマインダー。

- 「のんだ？」にワンタップで答えるだけ
- 定刻 / 食事相対（食後30分など）の両方に対応
- データは端末のみ（IndexedDB）

## ロードマップ

- [x] Web版プロトタイプ（Vite + React + TS + Tailwind v4 + Dexie）
- [ ] 通知（Web Push / Service Worker）
- [ ] PWA化（オフライン対応 / ホーム画面追加）
- [ ] Capacitor で Android 梱包
- [ ] Android ホーム画面ウィジェット（Kotlin）

## 開発

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 本番ビルド
```

## 技術スタック

- Vite 8 / React 19 / TypeScript
- Tailwind CSS v4
- Dexie (IndexedDB) + dexie-react-hooks
- Framer Motion / lucide-react / date-fns
