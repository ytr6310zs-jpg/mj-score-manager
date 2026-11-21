# Feature Specification: 管理画面 CRUD フィードバック整備

**Feature Branch**: `feature/issue-341-admin-crud-feedback`  
**Created**: 2026-11-21  
**Status**: Draft  
**合意クラス**: C  
**Input**: Issue #341 / F26 / G01・G02・G03・G10・G11

## User Stories

### US1 - 追加失敗が読める (P1)

プレイヤー／役満の追加で失敗したとき、画面上にエラー文言が出る。

### US2 - 送信中は二重送信しない (P1)

追加・保存の主要 submit が pending 中に `disabled`（または同等）になる。

### US3 - 滞在型でも成功が分かる (P1)

プレイヤー／大会／ユーザー／役満の追加・編集成功時、自動遷移せずに一度フィードバック（文言）が出る。

### US4 - 役満行編集の失敗が黙らない (P1)

役満一覧の行編集が失敗したとき、ユーザーが失敗を知覚できる。

### US5 - 主要入力に名前がある (P2)

管理 CRUD の主要 Input に可視ラベルまたは同等の accessible name を付ける（placeholder のみ依存を減らす）。

## Requirements

- FR-001: `PlayerAddForm` / `YakumanAddForm` で `!state.success && state.message` を表示する
- FR-002: 追加・保存 submit に `disabled={isPending}` を揃える（少なくとも Player/Yakuman/Tournament 追加、役満行編集）
- FR-003: 滞在型フォームで成功時も `state.message` を表示する（色分け。遷移しない）
- FR-004: 役満行編集を `useActionState(editYakumanTypeAction)` ベースのクライアント部品にし、失敗／成功メッセージと pending disabled を出す。成功時は `router.refresh()`（redirect 依存をやめる）
- FR-005: 主要フィールドに `Label` または `aria-label` を付与する（行内編集はレイアウト維持のため `aria-label` 可）
- FR-006: ユーザー追加／編集の password に `autoComplete="new-password"` を付与してよい
- FR-007: admin 削除の成功は行内ではなく画面上部（`AdminFeedbackRegion`）に一度表示する。失敗は削除ボタン付近のまま。対局削除（遷移型 flash）は対象外
- FR-008: admin 削除は `window.confirm` ではなく簡易インページ確認（キャンセル／削除する）。**モーダル Dialog・フォーカストラップ等の最終形は #336**（合意: 本 Issue では暫定で可）
- FR-009: 権限モデル・document title（#337）・ログインフォーム（#340）は変更しない。対局削除の確認 UI も #336

## Non-Goals

- 管理画面の見た目の大きな再設計
- 削除確認 UI の Dialog 化
- エラートラッキング基盤
- スコア入力 UI

## Success Criteria

- [ ] プレイヤー／役満追加の失敗が画面で読める
- [ ] 追加・保存中に主要 submit が disabled
- [ ] 成功時に一度フィードバックがあり、自動遷移しない
- [ ] 役満行編集の失敗が黙って終わらない
- [ ] admin 削除成功が一覧上部に一度表示される
