# Tasks: フィルタ状態共有

**Branch**: `feature/issue-239-filter-state-sharing`  
**Spec**: `.specify/specs/239-filter-state-sharing/spec.md`  
**Plan**: `.specify/specs/239-filter-state-sharing/plan.md`  
**Issue**: #239

---

## Phase 0: 実装開始準備

- [ ] **T-00** 当日 worklog を起票する
  ```bash
  npm run worklog:start -- \
    --summary "Issue #239 実装開始" \
    --reason "対局履歴・成績集計・相性表のフィルタ状態を共有し、スコア入力遷移後も保持するため" \
    --tags "issue-239,implementation,worklog"
  ```

- [ ] **T-01** 実装前に spec / plan / tasks の整合を再確認する

---

## Phase 1: 共有状態基盤

- [ ] **T-10** `lib/filter-state-preference.ts` を新規作成する
  - localStorage キー定義
  - `SharedFilterState` 型定義
  - read / write / clear / normalize 実装
  - `buildSharedFilterSearchParams()` 実装

- [ ] **T-11** `components/filter-state-sync.tsx` を新規作成する
  - URL に明示パラメータがある場合は保存状態へ同期する
  - URL に明示パラメータがない場合は保存状態から `router.replace()` で復元する
  - `includeMinGames` の有無を props で切り替える

---

## Phase 2: 既存 UI への組み込み

- [ ] **T-20** `components/date-range-filter.tsx` に共有状態保存処理を追加する
  - フィルタ変更時
  - 大会変更時
  - 試合数変更時
  - カスタム期間 submit 時

- [ ] **T-21** `components/date-range-filter.tsx` の保存処理で既存大会保存とも同期する
  - `setLastTournamentId()` を維持
  - `showMinGames=false` のページでは `minGames` を適用しない

- [ ] **T-22** `components/score-form.tsx` で大会変更時の shared state 同期を追加する
  - 既存の大会保持は維持
  - shared state がある場合のみ `tournamentId` を更新する

- [ ] **T-23** `components/app-header.tsx` に共有状態付きリンク生成を追加する
  - `matches`, `stats`, `compatibility` の href を動的生成
  - 保存状態がない場合は既存 URL を使う
  - `input` リンクの挙動は変えない

---

## Phase 3: 各ページへの配線

- [ ] **T-30** `app/matches/page.tsx` に `FilterStateSync` を組み込む
  - 対局履歴向けに `includeMinGames=false`
  - `hasExplicitSearchParams` 判定を追加
  - `minGames` 単独では explicit にしない

- [ ] **T-31** `app/stats/page.tsx` に `FilterStateSync` を組み込む
  - 成績集計向けに `includeMinGames=true`
  - 既存の year + 20 試合既定と衝突しないことを確認する
  - `minGames` 単独でも explicit になることを確認する

- [ ] **T-32** `app/compatibility/page.tsx` に `FilterStateSync` を組み込む
  - 相性表向けに `includeMinGames=true`
  - 既存の year + 20 試合既定と衝突しないことを確認する
  - `minGames` 単独でも explicit になることを確認する

---

## Phase 4: テスト

- [ ] **T-40** 共有状態ヘルパーのユニットテストを追加する
  - 正常な JSON 読み出し
  - 不正 JSON の無視
  - `custom` で `start/end` 欠落時の無効化
  - `includeMinGames=false` 時の URL 生成
  - explicit 判定ルールの確認

- [ ] **T-41** 既存 UI/統合テストの追加または更新を行う
  - フィルタ変更後に保存されること
  - URL 未指定ページで復元されること

- [ ] **T-42** 旧 URL 互換の確認を追加する
  - `mode=thisYear`
  - `mode=range&start=...&end=...`
  - 正規化後の shared state 更新

- [ ] **T-43** `npm run build` を実行する

- [ ] **T-44** `npm test` を実行する

- [ ] **T-45** 可能なら `npm run lint` を実行する

---

## Phase 5: 手動確認

- [ ] **T-50** 対局履歴・成績集計・相性表の相互遷移を確認する
  - 同じ大会・期間条件が維持されること

- [ ] **T-51** スコア入力を挟んだ復元を確認する
  - `/stats` → `/` → `/matches`
  - `/compatibility` → `/` → `/stats`
  - スコア入力で大会変更後に shared state の `tournamentId` も更新されること

- [ ] **T-52** 異常系を確認する
  - localStorage なし
  - 壊れた JSON
  - URL 明示指定あり
  - 直リンク時の `replace` が 1 回で止まること

---

## Phase 6: 実装完了後の記録

- [ ] **T-60** PR 本文に必須項目を記載する
  - 設計概要
  - 実装概要
  - 実行した検証コマンドと結果
  - 手動動作確認の内容
  - 既知の未解決事項
  - Worklog

- [ ] **T-61** `done_when` に「main マージ後に `npm run worklog:done` を実行」を明記する
  
<!-- done_when -->
- **done_when**: main マージ後に `npm run worklog:done` を実行する
  
- [x] **T-61** `done_when` に「main マージ後に `npm run worklog:done` を実行」を明記する