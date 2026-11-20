# Feature Specification: 対局編集の成功フィードバックを遷移型に統一

**Feature Branch**: `feature/issue-338-edit-success-redirect`  
**Created**: 2026-11-20  
**Status**: Draft  
**合意クラス**: B  
**Input**: Issue #338 / G01

## User Stories

### US1 - 成功は遷移先で一度だけ (P1)

編集成功時、編集画面に成功 Alert を出さず `/matches?flash=updated` のみで伝える。失敗時は編集画面にエラーを残す。

## Requirements

- FR-001: 成功時はフォーム内成功メッセージを表示しない
- FR-002: 成功時の遷移先 flash は維持
- FR-003: 失敗時のフォームメッセージは維持
