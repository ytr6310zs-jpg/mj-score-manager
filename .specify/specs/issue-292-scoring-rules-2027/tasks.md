# Tasks: 集計ルール変更（2027-01 以降適用）

**Input**: `.specify/specs/issue-292-scoring-rules-2027/`  
**Prerequisites**: spec.md / plan.md。Open Decisions は確定済み（Q1-A ガイドなし / Q2-A / Q3-A）  
**Related Issue**: #292

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 ブランチ `cursor/issue-292-scoring-rules-2027-b7b7` が `origin/develop`（main 取り込み済み）起点であることを確認する
- [x] T002 設計承認後、`npm run worklog:start` で Issue #292 実装開始を起票する

---

## Phase 2: Foundational（US1 基盤）

- [x] T003 [US1] `lib/scoring-rules.ts` に RuleSet（legacy / mleague-2027）、既定適用日、env 上書き、`resolveScoringRuleSet(gameDate)` を実装する
- [x] T004 [P] [US1] `test/scoring-rules.test.js` で日付境界・env・精度・許容誤差をテストする
- [x] T005 `supabase/migrations/20261118140000_games_scores_numeric.sql` で `score1`–`score4` / `score_total` を `NUMERIC(6,1)` にする（local DB 未起動のため適用検証は未実施・ファイル追加済み）
- [x] T006 [P] `.github/specs/app-spec.md` のスコア型と入力ルール概要を更新する

---

## Phase 3: User Story 1 - 適用日切替 (P1)

- [x] T007 [US1] `lib/validate-match.ts` を RuleSet 連携に改修する
- [x] T008 [US1] `test/validate-match.mjs` に旧ルール回帰と新ルール日付ケースを追加する
- [x] T009 [US1] `app/match-import-actions.ts` の合計チェックを RuleSet 許容に合わせる

---

## Phase 4: User Story 2 - 小数第1位 (P1)

- [x] T010 [P] [US2] `lib/matches.ts` のスコア読取を小数対応パーサに置換する
- [x] T011 [P] [US2] `lib/spreadsheet-import.ts` の `parseScore` から不必要な整数 `Math.round` を除去
- [x] T012 [US2] `components/score-form.tsx` で対局日に応じ `step` / 合計許容を切替える（ウマガイドなし）
- [x] T013 [US2] `components/match-edit-form.tsx` に同等の切替を入れる
- [x] T014 [P] [US2] 表示は `String(number)` で小数を保持（追加丸めなし）
- [x] T015 [US2] 小数入力の最小カバレッジ（`scoring-rules` / `validate-match`）を追加する

---

## Phase 5: User Story 3 & 4 - ウマ規約と候補表 (P2/P3)

- [x] T016 [P] [US3] `README.md` の入力ルールを更新する
- [x] T017 [P] [US4] 候補表と実装スコープを最終確認（ガイド／自動加算なし）

---

## Phase 6: Polish

- [x] T018 [P] Sheets 系 `Math.round` はオフライン補助のため README に注記（本番経路は `scoring-rules`）
- [x] T019 2026年経路は legacy RuleSet のまま（validate 回帰で担保）。DB 付き集計比較は local DB 未起動のため未実施
- [x] T020 `npm run build` / `npm run test:unit` 成功
