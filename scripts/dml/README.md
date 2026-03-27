このディレクトリには DML（データ操作）やデータ修正スクリプトを格納します。

- `fix-games-created-at.mjs`: `games` テーブルの重複行削除と `created_at` の重複解消を行う Node スクリプト。

運用手順:

1. `.env.local` または環境変数に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` を設定する。
2. 変更を実行する前にバックアップを取得すること（例: Supabase のエクスポート）。
3. スクリプトを実行: `node dml/fix-games-created-at.mjs`

注意: 本スクリプトは破壊的操作（DELETE/UPDATE）を行います。実行前にレビュー・承認を得てください。
