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

ローカル開発では staging / production の DB を参照せず、local Supabase を使うことを前提にします。`.env.local` には local Supabase の URL / key を設定してください。

スプレッドシート関連（`scripts/sheets/` 配下の補助スクリプト）を使う場合は、追加で以下を設定してください（スクリプト実行時のみ必要）。

- `GOOGLE_SPREADSHEET_ID`
- `GOOGLE_SHEET_TITLE`（任意。未指定時は先頭シート）
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`（`\\n` を含む1行文字列）

4. 開発サーバー起動

```bash
npm run dev
```

## ローカル Supabase による開発

Issue #52 の方針として、local 開発で staging DB を参照しないために local Supabase を標準環境とします。

前提:

- Docker が利用可能であること
- Supabase CLI が利用可能であること
- `supabase/config.toml` が未作成なら初回に初期化が必要であること

基本手順:

```bash
cp .env.example .env.local

# Supabase CLI は npx 経由で固定バージョン実行（再現性のため）
npx supabase@2.84.2 --version

# 初回のみ: local Supabase 設定を生成
# すでに supabase/config.toml がある場合は不要
npx supabase@2.84.2 init

# local Supabase を起動
npx supabase@2.84.2 start

# local の接続情報を確認
npx supabase@2.84.2 status

# local の接続情報を .env.local に設定
# 例:
# SUPABASE_URL=http://127.0.0.1:54321
# SUPABASE_SERVICE_ROLE_KEY=<status に表示される service_role key>
# SUPABASE_ANON_KEY=<status に表示される anon key>

# local DB を初期化し、supabase/migrations/ を適用
npx supabase@2.84.2 db reset

# seed を投入
npm run seeds

# アプリ起動
npm run dev

# 最終確認
npm run build
```

`.env.local` の最低例:

```dotenv
ACCESS_PASSWORD=your-shared-password
APP_ENV=development
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<local service role key>
SUPABASE_ANON_KEY=<local anon key>
```

確認ポイント:

- `SUPABASE_URL` が `db.example.supabase.co` のような remote URL になっていないこと
- `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` は `npx supabase@2.84.2 status` で取得した local 用の値であること
- local 起動中に staging / production の secrets を参照しないこと
- local 手順ではレガシー migration スクリプトを使わないこと（`supabase:reset` を使用）

検証手順（起動後）:

1. ブラウザで以下のページを確認して主要画面が表示されること: `/`, `/matches`, `/stats`, `/admin`。
2. コマンドラインから自動チェックを行うには（Next.js を起動後）、次を実行します:

```bash
# 起動してから実行
npm run check:local-pages
```

3. 最終確認としてビルドが通ることを確認します:

```bash
npm run build
```

トラブルシュート:

- `npx supabase@2.84.2 start` が失敗する場合: Docker Desktop / Docker Engine が起動しているか確認する
- `supabase/config.toml` が無い場合: `npx supabase@2.84.2 init` を先に実行する
- 接続先が不明な場合: `npx supabase@2.84.2 status` の出力を見て `.env.local` を更新する

運用ルール:

- local 開発では staging / production の URL や key を `.env.local` に入れない
- スキーマの正本は `supabase/migrations/` を使う
- local の検証は local Supabase 上で完結させる

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
- [x] 成績集計に範囲指定（開始日から終了日）を追加、当日チェックボックスを入れると開始、終了を当日にする
- [x] 対局履歴画面に日付によるフィルタを実装（開始日-終了日を指定）
