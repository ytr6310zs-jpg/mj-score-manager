# Implementation Plan: 画面全般の UI/UX 問題検出・修正（親）

**Branch**: `feature/issue-304-ux-audit-and-fixes` | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)  
**Related Issue**: [#304](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/304)  
**Change class**: **C**（トリアージ合意済み）  
**Status**: Approved — 実装中（検出・サブ化まで）

## Summary

親 #304 は UX 乖離の **検出カタログ** と **サブ Issue 切り出し** をリポジトリ／GitHub 上で完結させ、P1 修正はサブ単位で実装する。親ブランチではカタログ・親 Spec・必要なら検出結果のドキュメントを扱い、アプリの大規模一括改修はしない。

## Technical Context

**Language/Version**: TypeScript / Next.js 15（App Router）  
**Primary Dependencies**: React 19、既存 `components/`・`app/`  
**Storage**: 変更なし（DB マイグレーションなし）  
**Testing**: サブ実装時に該当 E2E／手動。親フェーズはカタログレビューが主  
**Target Platform**: Web（デスクトップ＋モバイル幅）  
**Project Type**: web-app  
**Constraints**: 最小差分。deprecate `/` は非致命を触らない。認証／schema は触らない  
**Scale/Scope**: 初回パス画面は spec の表（login / matches / import / edit / stats / admin / `/`）

## Constitution Check

| Gate | Status | Notes |
|---|---|---|
| Domain-First | PASS | スコア規則は変更しない |
| Spec-driven | PASS | Spec 3 点（本ディレクトリ） |
| Minimal diff | PASS | 親はドキュメント＋ Issue 切り出し中心 |
| Safety | PASS | 秘密・本番 URL を扱わない |
| Fail-up | PASS | サブで schema/認可が出たら D へ |

## Project Structure

### Documentation (this feature)

```text
.specify/specs/issue-304-ux-audit-and-fixes/
├── spec.md
├── plan.md
├── tasks.md
├── checklists/requirements.md
└── ux-findings.md          # 実装フェーズで作成（検出カタログ）
```

### Source Code（親フェーズで触らない想定）

```text
# 修正はサブ Issue のブランチで行う例:
app/matches/page.tsx
components/app-header.tsx
components/**/*.tsx
app/**/page.tsx
test/e2e/ui/*.spec.ts
```

親 PR にアプリ差分を含める場合は、検出で即直せる **極小・安全な P1**（文言・表示条件のみ）に限り、サブを切るコストが高いものだけ。迷ったらサブへ。

## Approach

### Phase A — 検出（親）

1. spec の対象画面×観点でウォークスルー（ローカルまたは staging）
2. `ux-findings.md` に Finding を追記（深刻度・振分）
3. #268 / #261 / #31 等へリンク可能なものは振分

### Phase B — サブ化（親）

1. 要対応かつ未振分を GitHub Issue 化（本文に Parent: #304）
2. 各サブで `/triage` → クラス合意 → 必要なら個別 Spec
3. P1 一覧をカタログと Issue で同期

### Phase C — 修正（サブ）

1. サブごとに `feature/issue-<n>-...` で実装・PR
2. マージ後カタログを「対応済み」に更新（親ブランチまたは追従コミット）
3. P1 完了／見送り後に #304 をクローズ

## Complexity / Risks

| Risk | Mitigation |
|---|---|
| 検出が無限に広がる | 初回パス画面を固定。P3 は記録のみ可 |
| 親に巨大差分が混入 | FR-003。迷ったらサブ |
| 既存機能 Issue と二重管理 | Q2。リンクのみ |
| `/` を直し始める | Q3 / #305 |

## 変更予定ファイル一覧（親・設計〜検出）

| ファイル | 内容 |
|---|---|
| `.specify/feature.json` | 本 feature を指す |
| `.specify/specs/issue-304-ux-audit-and-fixes/spec.md` | 要件 |
| `.specify/specs/issue-304-ux-audit-and-fixes/plan.md` | 本ファイル |
| `.specify/specs/issue-304-ux-audit-and-fixes/tasks.md` | タスク |
| `.specify/specs/issue-304-ux-audit-and-fixes/ux-findings.md` | 検出カタログ（実装開始後） |
| （任意）`docs/` への短いポインタ | 必須ではない |

サブ実装時のタッチファイルは各サブの plan で確定する。

## 実装フェーズの想定手順

1. 設計承認後、当日 worklog を起票
2. `tasks.md` Phase 1–2（カタログ作成・ウォークスルー）
3. Phase 3 でサブ Issue 作成（`gh issue create`）
4. P1 サブは別会話／別ブランチで `/triage` → 設計／実装
5. カタログ更新 → 親クローズ条件の確認

## Open Decisions（spec と同値・承認時）

- D1: カタログパス = `ux-findings.md`（推奨）
- D2: P2 残存で親クローズ **許容**
- D3: 検出＋サブ作成を親の実装フェーズに含める
