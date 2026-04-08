---
title: "Issue-126: 役満種別追加 — 四暗刻単騎 (ST), 数え役満 (KZ)"
date: 2026-04-08
status: proposed
issue: 126
---

## 概要

投入スクリプトに役満種別を2件追加する。

- 四暗刻単騎
  - コード: `ST`
  - 表示名: 四暗刻単騎
  - 略称: 四単
  - 表示順: 22

- 数え役満
  - コード: `KZ`
  - 表示名: 数え役満
  - 略称: 数え
  - 表示順: 8

Issue: https://github.com/ytr6310zs-jpg/mj-score-manager/issues/126

## 背景 / 問題

現在の投入（シード）スクリプトやマスターデータに上記2件が存在しないため、
アプリやインポート処理でこれらを扱えない。

## 提案内容
1. `supabase/migrations/20260406000000_create_yakuman_types.sql` のシードに2件を追加する（このリポジトリの canonical seed を更新）。
2. 併せて `lib/insert-yakuman.ts` に、プログラム経由で「役満種別」を投入できる補助関数を追加する（`insertYakumanTypes` をエクスポート）。
3. ローカルや CI で簡単に投入できるよう、`scripts/seed-yakuman-types.mjs` を用意する（既存の `scripts/seed-players.mjs` と同様の動作・idempotent 挿入）。
4. 追加後に `npm run build` と既存の yakuman 関連テスト（`test/yakuman-*.test.js`）を実行して問題がないことを確認する。

追加するレコードは、既存の yakuman レコードと同じフィールド構成（`code`, `name`, `points`, `description`, `sort_order` など）で作成する。

## 実施手順（実装案）

1. ブランチ `feature/issue-126-add-yakuman-types` を作成する。
2. `supabase/migrations/20260406000000_create_yakuman_types.sql` を編集して `KZ`（数え役満）と `ST`（四暗刻単騎）をシードに追加する。
   - 注意: 既に本マイグレーションが本番 DB に適用済みの場合は、このファイルを直接変更するのではなく、
     新しいマイグレーション（例: `20260408_add_ST_KZ_yakuman_types.sql`）を作成して差分を反映してください。
3. `lib/insert-yakuman.ts` に `insertYakumanTypes(supabase)` を追加し、プログラムから投入できるようにする（既存チェックを行い重複挿入しない）。
4. `scripts/seed-yakuman-types.mjs` を追加し、ローカルや CI から `node scripts/seed-yakuman-types.mjs` で投入できるようにする。
4. ローカルで `npm run build` → `npm test`（yakuman 関連テスト）を実行する。
5. 問題なければコミットしてレビューを依頼する。

## 影響範囲

- `lib/insert-yakuman.ts`
- 既存の yakuman 関連テスト: `test/yakuman-insert.integration.test.js`, `test/yakuman-migration.test.js`, `test/yakumans-lib.test.js`
- UI の表示順・ラベルに影響（表示順の重複に注意）。

## ロールバック

問題が発生した場合は追加したレコードの挿入コミットを revert し、DB のシードを元に戻す。

## 注意点

- `display_order` の値は既存と衝突しないか確認する。衝突があれば調整を提案する。
- `code` は一意制約があるため、既に存在する場合は挿入処理をスキップするか upsert を使う。

- マイグレーション編集の注意: 既にマイグレーションが本番に適用済みの場合、既存ファイルの直接編集は避け、
  新しいマイグレーションを作成して適用することを推奨します。本 ADR ではリポジトリ内の canonical seed を更新する案も併記しています。

**ローカル/CI 実行方法（例）**

- ローカル: `.env.local` に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` または `SUPABASE_ANON_KEY` を設定し、
  ```bash
  node scripts/seed-yakuman-types.mjs
  ```
- CI: 環境変数 `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY`（または `SUPABASE_ANON_KEY`）を設定して上記コマンドを実行してください。

**ライブラリ経由の利用**

- サーバーサイドで TypeScript 経由で利用する場合は `lib/insert-yakuman.ts` の `insertYakumanTypes` を呼び出せます。テストやサーバー起動時に自動投入する用途にも使えます。

---

この ADR は最小限の設計記録です。実装はこのブランチ上で行い、`npm run build` とテスト結果を添えて PR を作成してください。
