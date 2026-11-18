---
title: Issue #294 — 実装計画
issue: 294
---

概要
--
`ci.yml` と `required-files.yml` の `on:` から `push` を外し、`pull_request` のみ（対象ブランチ `main`, `develop`）にする。ジョブ本体・concurrency・他 workflow は触らない。

設計判断
--
1. **変更は 2 ファイルのトリガーのみ**
   - Issue 本文の YAML を正とする
   - `ci.yml`:
     ```yaml
     on:
       pull_request:
         branches: [ main, develop ]
     ```
   - `required-files.yml`:
     ```yaml
     on:
       pull_request:
         branches: [ main, develop ]
     ```
   - `required-files` は現状 `pull_request.branches: ["**"]` だが、Issue 指定どおり `main`/`develop` に揃える（重複除去と対象の一貫性）

2. **触らないもの**
   - `check-worklog.yml` / `check-spec.yml`（`edited` 維持）
   - `check-migrations.yml`
   - `migrate.yml`（schema 適用の `main` push）
   - `concurrency` 設定（PR ref ごとに分かれており現状で十分）

3. **検証方針**
   - 差分レビューで `on:` 以外が変わっていないこと
   - 本 PR の Checks で `push` 由来 run が無いこと（機能ブランチ push では `ci`/`check-files` が起動しない想定。観測は PR の `pull_request` 側）
   - `npm run build` は慣例実行（アプリコード非変更）

4. **リスク**
   - 直接 push 経路の無検査（Issue の「残る穴」として許容・明記）
   - `required-files` の対象ブランチ縮小で、仮に他 base の PR を作ると `check-files` が走らない → 運用上 base は `develop`/`main` のみなので許容

ステップ
--
1. Spec 3 点配置（本設計）
2. 承認後: 2 workflow の `on:` を更新
3. `npm run build` → PR（base `develop`）

ロールバック
--
`on:` に `push` を戻せば復旧。ジョブ定義は不変のため影響は起動回数のみ。
