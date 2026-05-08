# Feature Specification: CI最適化 Phase 1 — migrate-and-test 短縮

**Feature Branch**: `feature/issue-191-ci-optimization-phase1`  
**Created**: 2026-05-08  
**Status**: Draft  
**Related Issue**: #191

---

## 背景・目的

`migrate-and-test` ジョブの実行時間が長く（直近10実行の中央値: 約 4m30s）、
PR フィードバックループが遅い。Phase 1 として以下 3 施策のみ実施し、ジョブ時間を現状比 30% 以上削減する。

1. **npm キャッシュ最適化** — `actions/setup-node` の `cache: npm` を全ジョブに適用
2. **Playwright ブラウザキャッシュ** — `actions/cache` でブラウザバイナリを再取得不要に
3. **ジョブ分割** — `unit` → `migrate` → `e2e` の 3 ジョブに分割し早期失敗検出を実現

---

## User Stories

### US1 — ジョブ分割による早期失敗検出 (Priority: P1)

PR を push したとき、unit テストが失敗した場合は Supabase 起動を省いて素早くフィードバックを受け取りたい。

**Acceptance Scenarios**:
1. **Given** unit テストが失敗, **When** CI が実行される, **Then** `migrate` / `e2e` ジョブはスキップされる
2. **Given** unit / migrate が成功, **When** CI が実行される, **Then** `e2e` ジョブが実行される
3. **Given** すべて成功, **When** CI が実行される, **Then** coverage / playwright-report の artifact が取得できる

---

### US2 — npm キャッシュによるインストール時間短縮 (Priority: P2)

npm パッケージのキャッシュヒット時に `npm ci` の時間を短縮したい。

**Acceptance Scenarios**:
1. **Given** `package-lock.json` が変わらない, **When** CI が実行される, **Then** npm キャッシュがヒットし `npm ci` が高速化される

---

### US3 — Playwright ブラウザキャッシュ (Priority: P3)

Playwright ブラウザバイナリの再ダウンロードを防いで `e2e` ジョブを短縮したい。

**Acceptance Scenarios**:
1. **Given** `package-lock.json` と playwright バージョンが変わらない, **When** `e2e` ジョブが実行される, **Then** キャッシュヒットしブラウザダウンロードがスキップされる

---

## 受け入れ基準

- 対象: `migrate-and-test` 相当ジョブ（新設 `migrate` + `e2e` の合計）
- 目標: 現状比 30% 以上短縮 かつ中央値 15 分以内
- 品質条件:
  - `npm run build` 成功
  - `npm test` 成功
  - `npm run test:ui` 成功
  - artifact（coverage / playwright-report）取得維持

## 非スコープ

- DB スナップショット（`pg_dump`/`pg_restore`）
- E2E nightly 化
- セルフホストランナー
