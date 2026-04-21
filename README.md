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

## Supabase Free プラン向け Keepalive

Supabase Free プランでプロジェクトの休止を避けるため、GitHub Actions で `staging` / `prod` の両環境に定期 ping を送るワークフローを追加しています。

- ワークフロー: `.github/workflows/supabase-keepalive.yml`
- 実行タイミング: 12時間ごと + 手動実行（workflow_dispatch）
- 既定の ping 先: `/api/yakumans`

必要な Actions secrets（既存の secrets を流用）:

- `STAGING_DATABASE_URL` — staging 用 Postgres 接続文字列（他ワークフローと共用）
- `PROD_DATABASE_URL` — prod 用 Postgres 接続文字列（他ワークフローと共用）

新規 secret の追加は不要です。`psql "SELECT 1;"` で DB に直接クエリを投げるため、Vercel の Deployment Protection の影響も受けません。

## GitHub Actions 運用

現行運用で使う workflow:

- `.github/workflows/ci.yml` - build/test/lint と local Supabase migration 検証
- `.github/workflows/check-migrations.yml` - PR 時の migration チェック
- `.github/workflows/required-files.yml` - 必須ファイル存在チェック
- `.github/workflows/supabase-keepalive.yml` - staging / prod keepalive
- `.github/workflows/migrate.yml` - staging / preview / prod 向け migration 実行
- `.github/workflows/migrate-common.yml` - migrate 再利用本体
- `.github/workflows/reset-and-seed-players.yml` - staging / prod 向け reset + seed 実行

archive 済み workflow:

- historical import 系 workflow は役目を終えたため `.github/workflows-archive/` へ移動済み
- 旧 environment 別 wrapper (`migrate-staging.yml`, `migrate-prod.yml`, `staging-reset-and-seed-players.yml`, `prod-reset-and-seed-players.yml`) も統合に伴い `.github/workflows-archive/` へ移動済み

運用メモ:

- 手動 migration は `migrate.yml` の `target` で環境を選択する
- reset + seed は `reset-and-seed-players.yml` の `target` と `confirmation` で実行する
- archive された workflow は GitHub Actions の実行対象ではない

## スプレッドシート（補助スクリプト）について

アプリ本体は Supabase の `games` / `players` テーブルをデータソースとして動作します。Google スプレッドシートは移行・エクスポート・検証用の補助スクリプトでのみ利用します。スプレッドシート関連のスクリプトは `scripts/sheets/` にまとまっています。

主要なスクリプト:

- `scripts/sheets/import-players-from-sheet.mjs` — プレイヤーマスタを Google Sheets から読み取り、`players` テーブルへインポート
- `scripts/sheets/export-stats-sheet.mjs` — 集計結果をスプレッドシートへ書き出し（補助）
- `scripts/sheets/reset-sheet1-and-verify-from-image-seed.mjs` — テスト用に Sheet1 をリセットして画像シードを投入
- `scripts/sheets/verify-against-pdf-text.mjs` — Sheet1 と PDF抽出結果の照合・書き出し

### 開催済みCSVの投入（Issue #63）

`scripts/mahjong-data/*.csv` を `games` テーブルへ投入する専用スクリプトです。

```bash
# dry-run（変換件数の確認のみ）
npm run seed:historical:dry

# 実投入
npm run seed:historical
```

仕様:

- ファイル名 `YYYYMMDD.csv` を対局日として扱う
- ヘッダが数値の列のみを1対局として変換（非空スコア3人=3p、4人=4p）
- 列末尾の `飛ばし回数` / `飛び回数` / `焼き鳥回数` は日別集計列として読み取り、対局フラグへ反映する
- `notes` に `CSV_IMPORT:...` キーを付与し、再実行時は同キーで重複投入を回避
- `players.name` から `player*_id` / `top_player_id` / `last_player_id` / `tobi_player_id` / `tobashi_player_id` / `yakitori_player_ids` を解決

補足:

- CSV の追加3列は日別集計値のため、import スクリプトは集計回数が一致するよう対局フラグへ決定的に割り当てる
- `飛ばし回数` は高スコア対局を優先、`飛び回数` と `焼き鳥回数` は低スコア対局を優先して割り当てる
- 既存の `CSV_IMPORT:*` データがある場合も、再実行時にこれらのフラグと関連 ID を更新する

役満セル（`役満発生` 行）の拡張記法:

- 従来記法（例: `国士`）: `games.notes` のみ保存
- 拡張記法（例: `沢尾望:国士|加藤:大三元(32000)`）:
	- `games.notes` へ保存
	- `yakuman_occurrences` へも投入（`meta.source=csv-import` 付き）

注意:

- 拡張記法で指定するプレイヤー名は、その対局列の参加者名と一致させる
- 未登録プレイヤーが CSV に含まれる場合は投入を中断するため、先に `npm run seed:players` を実行する

これらのスクリプトを実行する場合は、Google API 用の環境変数（上に記載）を `.env.local` に追記してください。

## AI作業記録（自動生成と振り返り）

AIエージェント作業のトレーサビリティ向上のため、作業ログを `.worklog/` 配下へ自動生成できます。

基本コマンド:

```bash
# 作業エントリを追加（当日分のログがなければ自動作成）
npm run worklog:start -- --summary "入力検証の修正" --decision "検証はzodに統一" --next "stats集計の境界値テスト追加"

# 直近7日を振り返ってレビューを生成
npm run worklog:review -- --days 7
```

出力先:

- 日次ログ: `.worklog/logs/YYYY-MM-DD.md`
- 振り返り: `.worklog/reviews/review-YYYY-MM-DD.md`

主な記録内容:

- 実行日時
- 現在ブランチ
- 変更ファイル一覧（`git status --porcelain` ベース）
- 作業要約（summary）
- 決定事項（decisions）
- 次アクション（next actions）

運用注意:

- `.worklog/` は `.gitignore` 済み（ローカル運用前提）
- APIキー、トークン、個人情報などの機密情報は記録しない

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

## 役満定義の DB 化 と 管理

このリポジトリでは `yakuman_types` を参照テーブルとして追加し、既存の `yakuman_occurrences` はスナップショット（`yakuman_name` / `points`）を保持する非破壊設計になっています。

ローカルでマイグレーション・シードを適用する手順（local Supabase を利用する場合）:

```bash
# local Supabase を起動している前提
npx supabase@2.84.2 start

# マイグレーションを DB に適用（supabase CLI を利用する例）
npx supabase@2.84.2 db reset

# あるいは個別 SQL を実行する場合:
# psql "$DATABASE_URL" -f supabase/migrations/20260406000000_create_yakuman_types.sql

# 追加シードを投入（プロジェクトの seed スクリプトを利用）
npm run seeds
```

管理用 UI:

- 管理画面: `/admin/yakumans` — `yakuman_types` の一覧・追加・編集・無効化が可能です。

注意点:

- 管理画面の認可は未実装です。公開環境にデプロイする前に認可を追加してください。
- `yakuman_occurrences` は過去レコードの読み替えを避けるため、`yakuman_name` / `points` をスナップショットで保持します。将来的に `yakuman_types` を編集しても既存レコードの表示は変わりません。

運用フロー（推奨）:

1. 新しい役満を追加する場合は `yakuman_types` を管理画面で追加するか、SQL マイグレーションを作成して seed を追記してください。
2. 必要があれば既存の役満定義を `is_active=false` にして運用履歴を保ちつつ非表示にできます。
3. 本番環境へ反映する際は、マイグレーションとシードを CI/デプロイパイプラインへ組み込んでください。

