# ADR: スキーマ管理方針

## 状態
採用

## 日付
2026-03-31

## 背景
現状: `ddl/` にスキーマ用 SQL が置かれている。今後の運用ではスキーマ変更を安全に行い、CI で検証できる形に整備する必要がある。

## 決定
1. 実際に実行可能なマイグレーションは `supabase/migrations/` ディレクトリで管理する（タイムスタンプ付ファイル、Supabase CLI を用いて適用する正本）。
2. `ddl/` は初期スナップショットや参照用 SQL として read-only 扱いとし、日常の変更や CI の適用ソースにはしない。
3. 既存の `migrations/` はレガシー経路（deprecated）とし、段階的に `supabase/migrations/` へ移行・アーカイブする。
4. マイグレーション適用手段は `npx supabase@2.84.2 db push --db-url <DB_URL>` を標準とする。必要に応じて `psql` による個別適用や補助手段を CI に組み込む。
5. CI は `supabase/migrations/` を正本と見なし、重複定義検出・適用後の検証ステップを必須とする。

## 理由
- マイグレーションランナーによる順次適用は本番での安全な変更を保証する。ダウン/ロールバックを定義可能にすることで障害対応が容易になる。
- `design/` に実体 SQL を混在させるとドキュメントと実行アーティファクトの責務があいまいになるため分離が望ましい。
- Supabase CLI に統一することで local/CI/staging/prod の再現性を担保しやすい。

## 運用ワークフロー（概要）
1. 新しいスキーマ変更は `supabase/migrations/` にタイムスタンプ付き SQL ファイルとして作成する（例: `20260402000000_create_...sql`）。
2. マイグレーション SQL を実装（可能なら idempotent に記述）。
3. PR を作成し、変更理由を ADR・PR 本文に記載してレビューを受ける。
4. CI ではバックアップ → `npx supabase db push --db-url "$DATABASE_URL"` を実行し、その後テーブル存在などを検証するステップを走らせる。
5. マージ後、main の push トリガーまたは手動 workflow_dispatch により同様の手順で本番/ステージングへ適用する。

## CI 統合（推奨）
- GitHub Actions でバックアップ作成（`pg_dump`） → `npx supabase db push` により `supabase/migrations/` を適用 → 適用結果を `psql` 等で検証するワークフローを必須とする。失敗時は PR ブロッカーとする。
- ワークフローは `supabase/migrations/` を正本として扱い、`ddl/` や旧 `migrations/` に同一テーブル定義がある場合は検出して警告／失敗させるルールを入れる。

## コマンド例
```bash
# マイグレーション作成（手作業で SQL を追加する運用を想定）
# 例: supabase/migrations/20260402000000_create_yakuman_occurrences.sql を追加

# 適用（環境変数 DATABASE_URL を設定）
npx supabase@2.84.2 db push --db-url "$DATABASE_URL"

# 適用後の検証例
psql "$DATABASE_URL" -tAc "SELECT to_regclass('public.yakuman_occurrences');"
```

## 代替案と拒否理由
- Prisma Migrate: ORM と密結合になるため、現在の軽量なスキーマ管理には過剰。
- Flyway/Liquibase: 安定だが Java エコシステム依存で導入コストが増える。

## 次のアクション
1. 既存の `ddl/` のうち適用対象を `supabase/migrations/` に移行する（タイムスタンプ付ファイルを作成）。
2. 旧 `migrations/` は deprecated として `docs/migrations-deprecated.md` に運用方針を明記し、段階的に削除する計画を立てる。
3. CI ワークフロー（`.github/workflows/migrate-*.yml`）を `supabase/migrations/` が正本であることを前提に更新し、重複検知と適用検証を追加する。
4. ドキュメント（この ADR と `.github/MIGRATIONS.md`）を整合させる。
