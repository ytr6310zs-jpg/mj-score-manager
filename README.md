# mj-score-manager

Next.js (App Router) + TypeScript で作成した麻雀成績入力アプリです。

## 機能

- Middleware による共通パスワード認証
- 3人打ち / 4人打ちの切り替え
- 対局日・プレイヤー・最終スコア・飛び / 飛ばし / 焼き鳥 / メモの入力
- 送信前バリデーション（最終スコア合計は 0、四捨五入誤差として ±1 まで許容）
- Server Action 経由で Supabase の `games` テーブルへ保存（スプレッドシートは補助スクリプトでのみ利用）

## セットアップ

1. Node.js 20 以上をインストール
2. 依存関係をインストール

```bash
npm install
```

3. 環境変数を設定

```bash
cp .env.example .env.local
```

.env.local を編集して以下を設定してください（アプリ実行に必須）：

- `ACCESS_PASSWORD`
- `MFA_TOTP_SECRET`（任意。設定時はGoogle Authenticator等の6桁ワンタイムコードが必須）
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side operations)

スプレッドシート関連（`scripts/sheets/` 配下の補助スクリプト）を使う場合は、追加で以下を設定してください（スクリプト実行時のみ必要）。

- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_SHEET_TITLE`（任意。未指定時は先頭シート）
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`（`\\n` を含む1行文字列）

4. 開発サーバー起動

```bash
npm run dev
```

## スプレッドシート（補助スクリプト）について

アプリ本体は Supabase の `games` / `players` テーブルをデータソースとして動作します。Google スプレッドシートは移行・エクスポート・検証用の補助スクリプトでのみ利用します。スプレッドシート関連のスクリプトは `scripts/sheets/` にまとまっています。

主要なスクリプト:

- `scripts/sheets/import-players-from-sheet.mjs` — プレイヤーマスタを Google Sheets から読み取り、`players` テーブルへインポート
- `scripts/sheets/export-stats-sheet.mjs` — 集計結果をスプレッドシートへ書き出し（補助）
- `scripts/sheets/reset-sheet1-and-verify-from-image-seed.mjs` — テスト用に Sheet1 をリセットして画像シードを投入
- `scripts/sheets/verify-against-pdf-text.mjs` — Sheet1 と PDF抽出結果の照合・書き出し

これらのスクリプトを実行する場合は、Google API 用の環境変数（上に記載）を `.env.local` に追記してください。

## 現在の入力ルール

- 3人打ち / 4人打ちの半荘を記録できます
- 25,000点持ち / 30,000点返し、ウマなし前提の最終スコアを入力します
- 飛びと飛ばしは別途記録します
- 焼き鳥は該当者にチェックを付けます
- 将来の個人成績集計に使えるよう、順位や各種フラグもシートへ保存します

## TODO

- [x] 各ページの遷移ボタン追加
- [x] 対局履歴の編集・削除機能
- [x] 得点を2か所入力したら残りの1か所は自動入力(3人の合計得点が0になるため)
- [x] 同じユーザーが選択されている場合はエラーを表示(エラーを捕捉しメッセージを表示したい)
- [x] 削除時に画面のがくつきが気になる
- [x] スマホ対応（iPhone, Androidスマホの解像度で表示できること）
- [x] スコア保存時にスコア、飛び対象、飛ばし対象、焼き鳥、メモをclear
- [x] 各スコアをクリアする×ボタン追加
- [x] 対局の編集画面にもスコア入力画面と同様の仕様（×ボタン、２つのスコアが入力済みなら自動計算）とする（パーツの共通化？）
- [x] GoogleAuth等を利用した2要素認証（ワンタイムパスワードなど）
- [x] セッションタイムアウトを1時間に設定
- [ ] データソースを別のサービスにする
- [ ] 成績集計に範囲指定（開始日から終了日）を追加、当日チェックボックスを入れると開始、終了を当日にする
- [ ] 対局履歴画面に日付によるフィルタを実装（開始日-終了日を指定）
- [ ] Next.jsのバージョンアップ（LTS版へ移行）
