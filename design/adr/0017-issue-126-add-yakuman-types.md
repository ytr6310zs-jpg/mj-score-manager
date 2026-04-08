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

## 現在の呼び出し状況

- `lib/insert-yakuman.ts`
  - `insertYakumanOccurrences` は `app/actions.ts`（対局登録時）から呼ばれる。
  - `insertYakumanOccurrences` は `test/yakuman-insert.integration.test.js` からも呼ばれる。
  - `insertYakumanTypes` は現時点で本番コード・CIワークフローから未呼び出し。
- `scripts/seed-yakuman-types.mjs`
  - 現時点でどの workflow からも未呼び出し（手動実行のみ）。

## 設計見直し（Decision）

役満種別の初期投入は「migration内のseed」ではなく「seed処理」に寄せる。

1. migration の責務を「スキーマ作成」に寄せる。
2. 初期データ投入は seed 処理に集約する。
3. CI の `Staging Reset and Seed Players` / `Prod Reset and Seed Players` の seed ステップで、players に加えて yakuman_types も投入する。
4. ローカルでは `scripts/seed-yakuman-types.mjs` を利用可能にし、手動で再投入（idempotent）できる状態を維持する。

## 具体方針

### 1) データ定義

- 対象データ（Issue #126）
  - `KZ` / 数え役満 / sort_order=8
  - `ST` / 四暗刻単騎 / sort_order=22

### 2) ローカル seed

- `node scripts/seed-yakuman-types.mjs` を利用する。
- 実行要件: `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`（または `SUPABASE_ANON_KEY`）。
- 既存 `code` を確認して未登録分のみ追加する（idempotent）。

### 3) CI seed（要反映）

- `.github/workflows/staging-reset-and-seed-players.yml`
- `.github/workflows/prod-reset-and-seed-players.yml`

上記2つのワークフローに以下を追加する。

1. 既存 `Seed players via psql` の直後に `Seed yakuman types via psql` を追加。
2. `INSERT ... ON CONFLICT (code) DO NOTHING` で `KZ` と `ST` を投入。
3. 検証ステップで `KZ` と `ST` の存在チェックを追加。

### 4) migration の扱い

- 既に本番適用済み migration は原則書き換えない。
- 既存 migration に seed が残っていても、CI seed が idempotent なので二重投入は発生しない。
- 将来の整理として、yakuman_types seed は migration から段階的に外し seed 処理へ一本化する。

## 実施手順（実装案）

1. ブランチ `feature/issue-126-add-yakuman-types` を作成する。
2. `scripts/seed-yakuman-types.mjs` で `KZ` / `ST` を投入可能にする。
3. `Staging Reset and Seed Players` と `Prod Reset and Seed Players` に役満種別投入ステップを追加する。
4. ワークフローの検証ステップに `KZ` / `ST` 存在確認を追加する。
5. ローカルで `npm run build` と yakuman 関連テストを実行する。
6. 問題なければコミットしてレビューを依頼する。

## 影響範囲

- `lib/insert-yakuman.ts`
- `scripts/seed-yakuman-types.mjs`
- `.github/workflows/staging-reset-and-seed-players.yml`
- `.github/workflows/prod-reset-and-seed-players.yml`
- 既存の yakuman 関連テスト: `test/yakuman-insert.integration.test.js`, `test/yakuman-migration.test.js`, `test/yakumans-lib.test.js`
- UI の表示順・ラベルに影響（表示順の重複に注意）。

## ロールバック

問題が発生した場合は追加したレコードの挿入コミットを revert し、DB のシードを元に戻す。

## 注意点

- `display_order` の値は既存と衝突しないか確認する。衝突があれば調整を提案する。
- `code` は一意制約があるため、既に存在する場合は挿入処理をスキップするか upsert を使う。

- CI ワークフローで Node スクリプトを呼ぶ場合は `npm ci` が必要になるため、現状の workflow では psql seed の方が軽量。
- migration seed と workflow seed が共存しても、`ON CONFLICT DO NOTHING` を徹底すれば実害はない。

**ローカル実行方法（例）**

- ローカル: `.env.local` に `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` または `SUPABASE_ANON_KEY` を設定し、
  ```bash
  node scripts/seed-yakuman-types.mjs
  ```

**CI 実行方法（方針）**

- `Staging Reset and Seed Players` / `Prod Reset and Seed Players` の workflow 内で `psql` による idempotent insert を実行する。

**ライブラリ経由の利用**

- サーバーサイドで TypeScript 経由で利用する場合は `lib/insert-yakuman.ts` の `insertYakumanTypes` を呼び出せる。
- ただし本番運用の初期投入責務は workflow の seed ステップに持たせ、アプリ実行時の自動投入は行わない。

---

この ADR は最小限の設計記録です。実装はこのブランチ上で行い、`npm run build` とテスト結果を添えて PR を作成してください。
