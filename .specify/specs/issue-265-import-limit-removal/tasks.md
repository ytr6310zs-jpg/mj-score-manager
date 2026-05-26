---
title: TASKS - Issue #265 一括インポートの取り込み上限撤廃
---

## Phase 1: Parser Update

- [ ] T1 `lib/spreadsheet-import.ts` の主表ヘッダー判定から 40 上限を外す
  - Done条件: `findMainHeaderRow` が 41 以降の試合列を持つヘッダーを拒否しない
- [ ] T2 `lib/spreadsheet-import.ts` の試合列収集から 40 上限を外す
  - Done条件: `collectGameColumns` が 41 以降の列も `gameColumns` に入れる
- [ ] T3 `lib/spreadsheet-import.ts` の役満テーブル検証から 40 上限を外す
  - Done条件: `applyYakumanRows` が 41 以降の `gameNo` を対応試合へ紐づける
- [ ] T4 `lib/spreadsheet-import.ts` の warning 文言を上限非依存の表現へ更新する
  - Done条件: `1..40` を前提にしたユーザー向けメッセージが残っていない

## Phase 2: Regression Tests

- [ ] T5 `test/spreadsheet-import.test.js` に 41 以降の試合列を含む解析ケースを追加する
  - Done条件: 40 を超える `gameNo` が `games` に含まれることを確認できる
- [ ] T6 `test/spreadsheet-import.test.js` に 41 以降の役満テーブル行の紐づきケースを追加する
  - Done条件: 40 超の `gameNo` でも役満が試合へ紐づくことを確認できる
- [ ] T7 `test/spreadsheet-import.test.js` に既存の 1..40 回帰ケースを維持する
  - Done条件: 既存入力の解析結果が非回帰であることを確認できる

## Phase 3: Validation

- [ ] T8 `npm test` を実行して parser 回帰がないことを確認する
  - Done条件: 追加・既存の spreadsheet import テストが通る
- [ ] T9 `npm run build` を実行して TypeScript / Next.js のビルドが通ることを確認する
  - Done条件: ビルド成功
- [ ] T10 必要に応じて `npm run lint` を実行し、スタイル/型の警告を確認する
  - Done条件: 実行した場合は問題なし、未実施なら理由を記録できる

## Dependencies & Execution Order

- T1, T2, T3, T4 は同一ファイル内の近接変更のため順次実施する
- T5, T6, T7 は T1-T4 の変更後に追加する
- T8, T9, T10 は実装完了後に実施する

## Implementation Strategy

1. パーサーの上限制御を撤廃する
2. 40 超えケースと既存ケースのテストを追加する
3. `npm test` で回帰を確認する
4. `npm run build` で最終検証する