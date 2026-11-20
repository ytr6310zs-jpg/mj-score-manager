# Feature Specification: App Router の error / not-found 画面

**Feature Branch**: `feature/issue-339-error-not-found`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: B  
**Input**: Issue #339 / G14

## User Stories

### US1 - 未知 URL でアプリ内 404 (P1)

存在しないパスで Next 既定ではなく、戻り先リンク付きのアプリ内 404 を出す。

### US2 - レンダーエラーで再試行できる (P1)

セグメント内の例外でユーザー向けメッセージと再試行（または履歴へ）を出す。

## Requirements

- FR-001: `app/not-found.tsx` を追加し、文言と `/matches` へのリンクを用意する
- FR-002: `app/error.tsx` を追加し、文言・再試行（`reset`）・履歴へのリンクを用意する
- FR-003: 監視基盤・スコア入力 UI は対象外
- FR-004: 見た目は既存 UI（Alert / Button）に寄せ、ヘッダー必須ではない

## Non-Goals

- `global-error.tsx`（ルート layout 自体の失敗）は必須としない
- エラートラッキング（Sentry 等）
