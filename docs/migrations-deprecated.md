# migrations ディレクトリ（Deprecated）

`migrations/` はレガシー経路です。現行の正本は `supabase/migrations/` です。

## 背景
- 過去に `node-pg-migrate` の適用対象として使っていた履歴を保持するために残していました。

## 現在の運用
- `migrations/` は read-only のレガシー資産として扱います。
- 新規のスキーマ変更は `supabase/migrations/` にのみ追加します。
- `ddl/` は参照用スナップショットであり、適用ソースではありません。

## なぜ `migrations/` に説明ファイルを置かないのか
- CI の `migrate:up` 実行時、`node-pg-migrate` は `migrations/` 配下を読み込みます。
- `.md` など非SQLファイルを置くと拡張子解決エラーになり、CIが失敗します。

## 移行方針
1. 過去の必要な変更は `supabase/migrations/` に段階的に移行する。
2. 移行が完了したら `migrations/` 自体のアーカイブまたは削除を検討する。
