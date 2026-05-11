---
title: TASKS - スプレッドシート入力による一括インポート


### 実装タスク（全て完了）
- T15: `lib/spreadsheet-import.ts` 実装 — **✓ 完了**: parseSpreadsheetMatrix, resolveYakumanToken, buildAdhocYakumanDef 実装、ad-hoc 役満生成対応
- T16: `lib/import-entity-sync.ts` 実装 — **✓ 完了**: collectImportEntitiesForSelectedRows, buildMissingPlayerInsertRows, buildMissingYakumanTypeInsertRows
- T17: `app/match-import-actions.ts` 実装 — **✓ 完了**: previewMatchImportAction, confirmMatchImportAction, buildPreviewRows で自動作成フロー統合
- T18: `components/match-import-form.tsx` 実装 — **✓ 完了**: UI 更新、ready 判定で非ブロッキング警告、「取込可能（自動追加あり）」ラベル表示
- T19: DB 変更（import_dedupe_key） — **✓ 完了**: supabase/migrations/20250511113000_games_add_import_dedupe_key.sql 作成・適用

### テストタスク（全て完了）
- T20: Unit テスト（spreadsheet-import）— **✓ 完了**: 9 tests, スコアパース、フラグゆれ、T/TB 競合、役満集約、ad-hoc 役満解析（「役満テスト / TST」形式対応）
- T21: Integration テスト（entity sync）— **✓ 完了**: 3 tests, collectImportEntitiesForSelectedRows, buildMissingPlayerInsertRows, buildMissingYakumanTypeInsertRows
- T22: Server Action テスト — **✓ 完了**: Google Sheets API エラーハンドリング、権限制御、upsert エラー検証
- T23: E2E テスト（Playwright）— **✓ 完了**: 6 tests, ログイン → プレビュー表示 → 行選択 → 確定、モバイル幅表示確認

### バグ修正タスク（全て完了）
- T24: Playwright CI ログイン失敗修正 — **✓ 完了**: test.beforeEach で明示的なログイン処理追加
- T25: Playwright セレクタ安定化 — **✓ 完了**: 曖昧なセレクタ置換、テキストベース一致で安定性向上
- T26: 未登録プレイヤー選択許可 — **✓ 完了**: ready 判定からプレイヤー issue を除外、UI で非ブロッキング表示
- T27: 未知役満の形式許容 — **✓ 完了**: resolveYakumanToken で名/コード解析追加、ad-hoc 役満自動生成

### ドキュメント更新タスク（実施中）
- T28: spec.md 更新 — **進行中**: 自動作成、非ブロッキング警告、未知役満解析の実装概要を追記
- T29: plan.md 更新 — **進行中**: 実装サマリ、テスト実行結果を追記
- T30: user-manual.md 更新 — **進行中**: インポート機能セクション追加
- T31: worklog 更新 — **進行中**: 実装・テスト・修正の作業記録を追記
