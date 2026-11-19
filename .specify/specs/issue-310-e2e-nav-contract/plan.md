# Implementation Plan: E2E ヘッダー／画面遷移契約の安定化

**Branch**: `feature/issue-310-e2e-nav-contract` | **Date**: 2026-11-19 | **Spec**: `./spec.md`  
**Status**: Approved — 実装中  
**Related Issue**: #310（Parent #304） | **Unblocks**: #305 / PR #309

## Summary

Playwright が前提にする (1) 管理ハンバーガーの a11y／操作契約と (2) ログイン後・ページ間遷移の settle を最小差分で直す。#305 の deprecate 変更は触らない。develop に単独マージできる形にし、#309 は rebase／cherry-pick で取り込む。

## Technical Context

**Language/Version**: TypeScript / Next.js 15 / React 19  
**Primary Dependencies**: Playwright（CI `integration`）、`components/app-header.tsx`  
**Storage**: N/A（スキーマ変更なし）  
**Testing**: Playwright E2E（`admin-navigation` / `match-import`）、`npm run build`  
**Target Platform**: Web + GitHub Actions CI  
**Project Type**: web-application  
**Constraints**: 最小差分。権限モデル変更禁止。#305 スコープ（deprecate 文言・score-entry 削除）に踏み込まない  
**Scale/Scope**: ヘッダー Menu 1 箇所 + E2E 数ファイル（必要なら共有ログインヘルパー 1 つ）

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| Domain-First | PASS | 対局ドメイン変更なし。ナビ契約のみ |
| Spec-Driven | PASS | spec / plan / tasks を本ディレクトリに用意 |
| Minimal Diff | PASS | ヘッダー + E2E に閉じる |
| Safety | PASS | 認証ロジック・cookie は変更しない（待ち条件のみ） |
| Verification | PASS | build + 該当 E2E / CI integration |

**Post-design re-check**: `data-testid` 逃げや大規模ヘルパー共通化に広がったら Minimal Diff を再評価する。

## 技術方針

### US1: 管理メニュー契約

**推奨アプローチ（順に試す）**:

1. **ARIA 構造を正す（第一候補）**  
   `role="menu"` 直下にユーザー情報 `<div>` があるため、メニューのアクセシブルネーム／子 role が Playwright から欠ける可能性がある。  
   - ユーザー情報ブロックを `role="menu"` の外へ出す、または  
   - ナビ用途なら `role="menu"` / `menuitem` をやめ、disclosure（`aria-expanded` + 通常の `link`）に揃える  
   後者の場合 E2E は `getByRole('link', { name: '管理' })` に合わせる。

2. **開閉の安定化**  
   クリック直後に `pointerdown` 外側判定で閉じないか確認。必要なら open 後にメニューコンテナの可視を待ってから項目をクリック。

3. **テスト側**  
   UI 契約に合わせてセレクタを更新。ログイン待ちを US2 の共通ヘルパーに寄せる（develop: admin→`/`、#305 後: `/matches` の両対応）。

### US2: 遷移 settle

1. ログイン後: `waitForURL` で pathname ∈ {`/`, `/matches`}（またはロール既知なら片方）→ 安定見出し（「対局履歴」or スコア入力見出し）→ `domcontentloaded`／必要なら `networkidle` は避ける（フレーク源）  
2. 後続 `goto`: `waitUntil: 'domcontentloaded'` + 対象ページ見出し待ち  
3. 重複する login シーケンスは `test/e2e/ui/helpers/auth.ts`（仮）へ最小抽出してよい。全スペックの総置換はしない（`filter-state-e2e` 等は今回の失敗に出ていなければ触らない）

### #305 との関係

| 項目 | #310 | #305 |
|---|---|---|
| ログイン redirect 変更 | しない（develop のまま） | 全ロール `/matches` |
| E2E login wait | `/` と `/matches` 両対応 | #310 取り込み後は `/matches` 固定でも可 |
| score-entry / docs | 触らない | 担当 |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/issue-310-e2e-nav-contract/
├── spec.md
├── plan.md
├── tasks.md
└── checklists/requirements.md
```

### Source Code（変更想定）

```text
components/app-header.tsx          # Menu ARIA / 開閉
test/e2e/ui/admin-navigation.spec.ts
test/e2e/ui/match-import.spec.ts
test/e2e/ui/helpers/auth.ts        # 任意・新規
```

## 変更予定ファイル一覧

| ファイル | 変更内容 |
|---|---|
| `components/app-header.tsx` | ハンバーガーの a11y 構造修正（menu 内の非 menuitem 排除、または disclosure + link） |
| `test/e2e/ui/admin-navigation.spec.ts` | ログイン settle、メニューセレクタを新契約に合わせる |
| `test/e2e/ui/match-import.spec.ts` | ログイン／goto settle 強化 |
| `test/e2e/ui/helpers/auth.ts` | （任意）共有ログインヘルパー |
| `.specify/feature.json` | 本 feature を指す |
| `.specify/specs/issue-310-e2e-nav-contract/*` | 本設計一式 |

**明示的に触らない**: `app/login/actions.ts`、`components/score-form.tsx`、score-entry 削除、docs／app-spec（#305）

## Complexity Tracking

| 逸脱 | なぜ必要か | より単純な案を捨てた理由 |
|---|---|---|
| （なし予定） | — | `data-testid` のみ追加は a11y 不具合を残すため第一候補にしない |

## 実装フェーズの想定手順（承認後）

1. `npm run worklog:start`（implementation タグ）
2. tasks.md の Phase 順に US1 → US2
3. ローカルまたは CI で該当 E2E 確認、`npm run build`
4. `/pr` で develop 向け PR。本文に #310 / Unblocks #305 を記載
5. マージ後、#305 会話側で PR #309 を rebase して CI 再確認
