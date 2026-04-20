---
applyTo: "supabase/migrations/**/*.sql"
---

# SQL Migration 規約 (Supabase/PostgreSQL)

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- ファイル名は `YYYYMMDDHHmmss_description.sql` 形式を守る。
- 破壊的変更（列削除・型変更・NOT NULL化）は既存データ移行手順を同一PRで提示する。
- 外部キー・ユニーク制約・インデックスの追加は既存データとの整合を確認してから適用する。
- 追加する列・テーブルには適切な `DEFAULT` / `NOT NULL` 方針を明示する。
- 既存運用に影響がある変更は冪等性を考慮する（`IF NOT EXISTS` 等）。
- 機密値・環境依存値を migration に直接埋め込まない。

## SHOULD

- 複数ステップの変更は `BEGIN; ... COMMIT;` でトランザクション化する。
- 大量データ更新を伴う変更は DDL と backfill を分割し、ロック時間を短くする。
- 命名は一貫させる（例: `idx_<table>_<column>`、`<table>_<column>_fkey`）。
- コメントを冒頭に書き、目的と前提を明示する。
- `UPDATE` や `DELETE` は `WHERE` 条件を明確化し、全件更新の意図がある場合はコメントで明示する。
- `ddl/` は参照用スナップショットとして扱い、適用の正は `supabase/migrations/` とする。

## このプロジェクト固有の指針

- `games.game_type` は `'3p'` / `'4p'` の制約を維持する。
- 三人打ちで空になり得る列（`player4`, `score4`, `rank4` など）の互換性を壊さない。
- 大会・役満関連の追加時は、集計系クエリ（`lib/stats.ts` など）への影響を同一PRで確認する。
