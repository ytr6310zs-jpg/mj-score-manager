# Feature Specification: アプリ / CI / staging の Node.js 24 移行

**Feature Branch**: `feature/issue-285-nodejs-24-runtime`  
**Created**: 2026-10-22  
**Status**: Approved (plan execution requested)  
**Related Issue**: #285

---

## 背景・目的

Node.js 20 は 2026-04-30 に EOL 済み。本リポジトリは `engines.node: ">=20.19.0 <21"` / Volta `20.19.0` のままである。2026-10-21 のセキュリティリリース（例: CVE-2026-111497）は 22/24/26 のみ修正され、20 系にはパッチが入らない。

#245 / #246 は GitHub Actions の action 実行ランタイムの話であり、アプリ本体の Node ランタイム移行とは別件。

一旦のゴールは **staging（Vercel Preview + staging Supabase）での動作確認完了**（10/29 目標）。本番反映は非スコープ。

---

## User Stories

### US1 — サポート済み Node 24 でビルド・CI が通る (Priority: P1)

開発者として、ローカルと CI が Node.js 24.x で再現可能に動き、EOL ランタイムに依存したくない。

**Acceptance Scenarios**:

1. **Given** `package.json` の engines / Volta が 24.x 系, **When** `npm ci` と `npm run build` を実行する, **Then** 成功する
2. **Given** CI workflow の `node-version` が `24`, **When** unit / integration が実行される, **Then** 成功する

### US2 — staging が Node 24 で動作する (Priority: P1)

運用者として、staging Preview が Node 24 でデプロイされ、対局入力などの主要機能が動くことを確認したい。

**Acceptance Scenarios**:

1. **Given** Vercel の Node.js Version と `engines.node` が 24.x, **When** staging Preview をデプロイする, **Then** ビルドが Node 24 で成功する
2. **Given** staging Preview URL, **When** ログイン・入力・履歴/統計を確認する, **Then** 主要画面がエラーなく動作する

---

## 受け入れ基準

- `engines` / Volta / CI / migrate・reset workflow の Node が 24 系に揃っている
- `npm run build` 成功、CI（unit + integration）成功
- staging Preview が Node 24 でデプロイされている
- staging 手動チェックリストを通過した記録がある

## 非スコープ

- 本番（prod）への反映
- #246（Actions `@v4` 昇格のみ）
- 機能追加・データ準備
