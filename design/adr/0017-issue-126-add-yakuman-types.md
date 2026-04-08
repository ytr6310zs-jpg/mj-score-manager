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

1. `lib/insert-yakuman.ts`（既存の投入スクリプト）に2件を追加する。
2. 必要であれば Supabase のシード/マイグレーションに同内容を反映する（既にマイグレーションがあるか要確認）。
3. 追加後に `npm run build` と既存の yakuman 関連テスト（`test/yakuman-*.test.js`）を実行して問題がないことを確認する。

追加するレコードは、既存の yakuman レコードと同じフィールド構成（`code`, `name`, `short`, `description`, `display_order` など）で作成する。

## 実施手順（実装案）

1. ブランチ `feature/issue-126-add-yakuman-types` を作成する。
2. `lib/insert-yakuman.ts` に2件のオブジェクトを追加する（idempotent に挿入できるよう既存チェックを維持）。
3. 必要なら `supabase/migrations` やシードファイルに同内容を追加する。
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

---

この ADR は最小限の設計記録です。実装はこのブランチ上で行い、`npm run build` とテスト結果を添えて PR を作成してください。
