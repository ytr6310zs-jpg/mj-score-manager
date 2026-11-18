# Tasks: 集計ルール変更（2027-01 以降適用）

**Input**: `.specify/specs/issue-292-scoring-rules-2027/`  
**Prerequisites**: spec.md / plan.md。Open Decisions は確定済み（Q1-A ガイドなし / Q2-A / Q3-A）  
**Related Issue**: #292

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [ ] T001 ブランチ `cursor/issue-292-scoring-rules-2027-b7b7` が `origin/develop`（main 取り込み済み）起点であることを確認する
- [ ] T002 設計承認後、`npm run worklog:start` で Issue #292 実装開始を起票する

---

## Phase 2: Foundational（US1 基盤）

**⚠️ CRITICAL**: Story 実装の前提

- [ ] T003 [US1] `lib/scoring-rules.ts` に RuleSet（legacy / mleague-2027）、既定適用日、env 上書き、`resolveScoringRuleSet(gameDate)` を実装する
- [ ] T004 [P] [US1] `test/scoring-rules.test.js`（または同等）で日付境界・env・精度・許容誤差をテストする
- [ ] T005 `supabase/migrations/YYYYMMDDHHMMSS_games_scores_numeric.sql` で `score1`–`score4` / `score_total` を `NUMERIC(6,1)` にする（local 検証）
- [ ] T006 [P] `.github/specs/app-spec.md` のスコア型と入力ルール概要を更新する

**Checkpoint**: RuleSet テスト通過、マイグレーション適用可

---

## Phase 3: User Story 1 - 適用日切替 (P1)

- [ ] T007 [US1] `lib/validate-match.ts` を RuleSet 連携に改修する（精度・範囲・合計許容）
- [ ] T008 [US1] `test/validate-match.mjs` に旧ルール回帰と新ルール日付ケースを追加する
- [ ] T009 [US1] `app/match-import-actions.ts` の合計チェックを RuleSet 許容に合わせる

**Checkpoint**: 旧日付は整数±1、新日付は新 RuleSet

---

## Phase 4: User Story 2 - 小数第1位 (P1)

- [ ] T010 [P] [US2] `lib/matches.ts` の `toInt` を小数対応パーサに置換する
- [ ] T011 [P] [US2] `lib/spreadsheet-import.ts` の `parseScore` から新ルール向けの不必要な `Math.round` を除去／分岐する
- [ ] T012 [US2] `components/score-form.tsx` で対局日に応じ `step` / クライアント合計チェック / 文言を切替える（**ウマガイドは追加しない**）
- [ ] T013 [US2] `components/match-edit-form.tsx` に同等の切替を入れる（ガイドなし）
- [ ] T014 [P] [US2] 成績・履歴・必要なら print/export で小数第1位を落とさない
- [ ] T015 [US2] 小数入力の最小カバレッジ（unit または e2e）を追加する

**Checkpoint**: 新ルール日の小数が往復できる。ガイド UI が無いこと

---

## Phase 5: User Story 3 & 4 - ウマ規約と候補表 (P2/P3)

- [ ] T016 [P] [US3] `README.md` の入力ルールを更新する（適用日、4p はウマ込み最終ポイント、ガイドなし、3p は小数のみ）
- [ ] T017 [P] [US4] spec の候補表と実装タスクに見送り項目が混入していないことを最終確認する

**Checkpoint**: ドキュメントと tasks のスコープ一致。自動加算・ガイド実装タスクが無いこと

---

## Phase 6: Polish

- [ ] T018 [P] Sheets 等の `Math.round` が本番経路に影響する場合は最小修正または注記する
- [ ] T019 2026年範囲の集計不変（SC-003）を確認する
- [ ] T020 `npm run build`（推奨: lint / test）を通し結果を残す

---

## Dependencies

- Setup → Foundational → US1 → US2 → Docs(US3/4) → Polish
- US3 はガイドなしのため、実装コードよりドキュメントが主。US2 のフォームにガイドを足さないこと

## MVP

T001–T009（切替）→ T010–T015（小数）→ T016–T017（規約文書）→ T018–T020

## Notes

- commit / push / PR はユーザー明示時（`/pr`）に従う運用と、Cloud Agent 指示がある場合はその命名規則を優先
