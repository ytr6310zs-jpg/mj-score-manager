# ADR: スキーマ管理方針

## 状態
採用

## 日付
2026-03-31

## 背景
現状: `ddl/` にスキーマ用 SQL が置かれている。今後の運用ではスキーマ変更を安全に行い、CI で検証できる形に整備する必要がある。

## 決定
1. 実際に実行可能なマイグレーションは `migrations/` ディレクトリで管理する（連番またはタイムスタンプ付ファイル）。
2. `ddl/` は初期スナップショット（`ddl/initial.sql`）や参考用に残すが、日常の変更は全てマイグレーションで行う。
3. `design/` は設計ドキュメント（ER 図、ADR、マイグレーション方針、手順）を格納する場所とする。
4. マイグレーションツールは Node 環境に馴染む `node-pg-migrate` を第一候補とする。将来的に別ツールへ移行することを妨げない。

## 理由
- マイグレーションランナーによる順次適用は本番での安全な変更を保証する。ダウン/ロールバックを定義可能にすることで障害対応が容易になる。
- `design/` に実体 SQL を混在させるとドキュメントと実行アーティファクトの責務があいまいになるため分離が望ましい。
- `node-pg-migrate` は既存の Node/Next.js ワークフローに馴染みやすく、導入コストが低い。

## 運用ワークフロー（概要）
1. 新しいスキーマ変更は `npx node-pg-migrate create <desc> --migrations-dir migrations` で雛形を作成。
2. マイグレーションを実装（`up` と可能なら `down` を記述）。
3. PR を作成し、変更理由を ADR・PR 本文に記載。レビューを受ける。
4. CI ではテスト用 DB を立てて `migrate up` を実行し、その後テストを走らせる。
5. マージ後、デプロイ環境でマイグレーションを順次実行する。

## CI 統合（推奨）
- GitHub Actions で Postgres サービスコンテナを用意し、マイグレーションを適用してからテスト実行。失敗時は PR ブロッカーとする。

## コマンド例
```bash
# マイグレーション作成
npx node-pg-migrate create add-players-table --migrations-dir migrations

# 適用（環境変数 DATABASE_URL を設定）
DATABASE_URL=postgres://user:pass@localhost:5432/db npm run migrate:up
```

## 代替案と拒否理由
- Prisma Migrate: ORM と密結合になるため、現在の軽量なスキーマ管理には過剰。
- Flyway/Liquibase: 安定だが Java エコシステム依存で導入コストが増える。

## 次のアクション
1. `migrations/` ディレクトリを作成し、既存 `ddl/` を初期マイグレーションへ移行する。 
2. `node-pg-migrate` を devDependency として導入し、`package.json` にスクリプトを追加する。 
3. CI ワークフローにマイグレーション検証ステップを追加する PR を作成する。
