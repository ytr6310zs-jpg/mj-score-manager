# Feature Specification: GitHub Actions の Node.js 20 非推奨警告への対応

**Feature Branch**: `feature/issue-245-github-actions-nodejs-20-deprecation`  
**Created**: 2026-05-09  
**Status**: Draft  
**Related Issue**: #245

---

## 背景・目的

GitHub Actions の runner で Node.js 20 が非推奨となり、2026-06-02 から Node.js 24 がデフォルトになる予定です。現在の `.github/workflows/ci.yml` では以下のアクションが Node.js 20 ベースで実行されており、将来的に CI が破綻する可能性があります。

- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/cache@v4`
- `actions/upload-artifact@v4`

このアラートを解消し、Node.js 24 での安定実行を確保する。

---

## User Stories

### US1 — GitHub Actions の非推奨警告解消 (Priority: P1)

CI ログの警告「Node.js 20 actions are deprecated」を消して、CI 安定性を確保したい。

**Acceptance Scenarios**:
1. **Given** CI が実行される, **When** `.github/workflows/ci.yml` が最新版 actions を使用している, **Then** Node.js 20 非推奨警告が出力されない
2. **Given** CI ジョブが実行される, **When** unit / integration ジョブが従来通り成功する, **Then** 動作は維持される
3. **Given** Node.js 24 切り替え日以降, **When** CI が実行される, **Then** アクションが正常に動作し続ける

---

## 受け入れ基準

- 対象: `.github/workflows/ci.yml`
- 目標: Node.js 20 非推奨警告が CI ログから消える
- 品質条件:
  - `npm run build` 成功
  - `npm run lint` 成功（CI上）
  - `npm run test:coverage` / `test:integration` / `test:e2e` / `test:ui` 成功（CI上）
  - CI 実行時間が大幅に増加しない（current: unit 75s + integration 187s）

## 非スコープ

- GitHub Actions CLI の更新（actions/github-script など）
- 他の GitHub workflow ファイルの更新（必要なら後続課題として別管理）
- Node.js ランタイム自体のアップグレード（リポジトリの node_version は現行 20 のまま保持）
