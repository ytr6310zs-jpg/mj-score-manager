このディレクトリは `games.created_at` の重複解消に関する DML 資産を格納します。

- `fix-games-created-at.mjs`: `games` テーブルの完全一致重複行を削除し、`created_at` が重複する行のタイムスタンプを秒単位でずらすスクリプト。

利用手順:
1. `.env.local` または環境変数に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を設定する。
2. 実行前にデータのバックアップを取ること（Supabase のエクスポート等）。
3. スクリプトを実行: `node dml/fix-games-created-at/fix-games-created-at.mjs`

注意: DELETE/UPDATE を伴う破壊的操作です。実行はレビュー・承認後に行ってください。
