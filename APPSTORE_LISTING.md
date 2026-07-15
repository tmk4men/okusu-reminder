# App Store 掲載テキスト（おくすリマインダー / iOS）

各項目を App Store Connect にコピペで使えます。文字数は Apple の上限。

---

## App名（30文字以内・ストアで一意が必須）
おくすリマインダー 服薬管理

（別案）おくすリマインダー：飲み忘れ防止 / おくすリマインダー お薬・サプリ記録

## サブタイトル（30文字以内）
ワンタップで飲み忘れゼロ。服薬・サプリ管理

（別案）
- ペンギンと続ける、お薬・サプリ記録
- 「飲んだっけ？」をなくす服薬リマインダー

## キーワード（100文字以内・カンマ区切り・スペース不要）
服薬,薬,おくすり,飲み忘れ,サプリ,ピル,漢方,服用,リマインダー,通知,アラーム,健康管理,お薬手帳,記録,習慣,体調管理,ペンギン,育成

## プロモーション用テキスト（170文字以内・審査なしでいつでも変更可）
「のんだ？」にワンタップで答えるだけ。お薬とサプリの飲み忘れ、「あれ、飲んだっけ？」をなくすやさしい服薬リマインダー。相棒はペンギンのヒナ・のんちゃん。続けるほど成長します。データは端末内だけ、登録不要ですぐ始められます。

---

## 概要（4000文字以内）

「のんだ？」にワンタップで答えるだけ。
お薬・サプリの飲み忘れと「あれ、飲んだっけ？」をなくす、やさしい服薬リマインダーです。

▍こんな方へ
・毎日のサプリやお薬をつい忘れてしまう
・「さっき飲んだかどうか」思い出せなくなる
・ピルや漢方など、決まった時間に続けたいものがある
・これまで記録アプリが続かなかった

▍特長

■ ワンタップで記録
通知が届いたら「のんだ？」に答えるだけ。面倒な入力はいりません。

■ 忘れないリマインダー
おくすり・サプリごとに時間を設定。その時間にやさしくお知らせします。

■ 相棒はペンギンの「のんちゃん」
続けるほど、のんちゃんが少しずつ成長します。ひとりじゃない服薬習慣に。

■ あゆみでひと目
飲んだ記録がカレンダーに残り、続けてきた自分がわかります。

■ 服薬期間の設定
「7日分」「2週間」など期間を決めて管理。飲み切りもサポートします。

▍プライバシー第一
データはすべてあなたの端末の中だけに保存され、サーバーには送信しません。アカウント登録も不要。ダウンロードしてすぐに始められます。

▍料金
基本無料でお使いいただけます。お薬・サプリは3件まで無料で登録できます。
プレミアム（¥500 買い切り）にすると、登録数が無制限になります。一度のご購入でずっとお使いいただけます。

毎日の「のんだ？」を、のんちゃんと一緒に。

※本アプリは服薬の記録・管理をサポートするものであり、医学的な診断・治療・助言を行うものではありません。お薬の服用については医師・薬剤師の指示に従ってください。

▍利用規約・プライバシー
・利用規約（EULA）：https://okusu-reminder.vercel.app/terms.html
・プライバシーポリシー：https://okusu-reminder.vercel.app/privacy.html
自動更新サブスクリプションの条件・解約方法は上記の利用規約に記載しています。

---

## このバージョンの新機能（初回 v1.0）
はじめまして、おくすリマインダーです。
お薬・サプリの飲み忘れをなくす、ワンタップの服薬リマインダー。ペンギンの「のんちゃん」と一緒に、今日から続けていきましょう。

---

## App審査に関する情報（Review Notes）

### ログイン
不要（アカウント登録なし・全データ端末内）。デモアカウントは不要です。

### メモ本文（日本語）
本アプリはお薬・サプリの飲み忘れを防ぐ服薬リマインダーです。

- 前回の起動時クラッシュ（Guideline 2.1(a)）は、Info.plist の GADApplicationIdentifier 欠落が原因でした。本ビルドで追加し、実機で起動を確認済みです。
- 本アプリは iPhone 専用です。
- アカウント登録・ログインは不要です。すべてのデータは端末内（オフライン）に保存され、サーバーには送信しません。
- リマインダーはローカル通知で実現しています。初回に通知の許可をお願いします。
- App内課金「プレミアム」は2プランから選べます（どちらも広告非表示＋おくすり登録が無制限になります）。
  - 買い切り：product ID `premium_lifetime`（非消耗型・¥500・一度のお支払い）
  - 月額：product ID `premium_monthly`（自動更新サブスクリプション・¥300/月）
  テスト方法：お薬を3件登録すると無料枠が上限になり、4件目を追加しようとするとプレミアム購入画面が表示されます。設定画面の「プレミアム」からも開けます。購入画面でプランを選び、購入または「購入を復元」ができます。
- 自動更新の条件・解約方法・利用規約(EULA)・プライバシーポリシーへのリンクは購入画面内に表示しています（利用規約: https://okusu-reminder.vercel.app/terms.html ）。
- 本バージョンでは広告（AdMob）は表示していません。
- 本アプリは服薬の記録・管理を補助するもので、医学的な診断・治療・助言は行いません。

ご確認よろしくお願いいたします。

### メモ本文（English / 併記推奨）
This app is a medication & supplement reminder that helps users avoid missed doses.

- The previous launch crash (Guideline 2.1(a)) was caused by a missing GADApplicationIdentifier in Info.plist. It has been added in this build and launch was verified on a physical device.
- This app is iPhone only.
- No account or login is required. All data is stored locally on the device (offline) and is never sent to any server.
- Reminders use local notifications; please allow notifications on first launch.
- The "Premium" in-app purchase offers two plans (both remove ads and unlock unlimited medications):
  - One-time: product ID `premium_lifetime` (non-consumable, ¥500, one-time payment)
  - Monthly: product ID `premium_monthly` (auto-renewable subscription, ¥300/month)
  How to test: after registering 3 medications the free limit is reached; adding a 4th shows the Premium screen (also available from Settings > Premium). Choose a plan on that screen to purchase, or tap "Restore Purchases".
- Auto-renewal terms, cancellation instructions, and links to the Terms of Use (EULA) and Privacy Policy are shown on the purchase screen (EULA: https://okusu-reminder.vercel.app/terms.html ).
- This build does not display any ads (AdMob is disabled).
- The app assists with logging/reminding only and does not provide medical diagnosis, treatment, or advice.

Thank you for the review.

---

## メモ
- **プロモーション用テキスト**は審査なしでいつでも変更可。**概要・キーワード**の変更はアプリのアップデート提出時のみ反映。
- iOS 版は広告オフのため、プレミアムの訴求は「登録無制限」中心にしている。将来 iOS で広告を有効化したら、概要の料金欄に「広告も非表示になります」を追記する。
- サポートURL/プライバシーポリシーURL: https://okusu-reminder.vercel.app/privacy.html
