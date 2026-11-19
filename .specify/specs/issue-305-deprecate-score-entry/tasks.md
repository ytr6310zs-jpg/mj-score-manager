# Tasks: スコア入力画面の非推奨化と初期遷移変更

**Input**: Design documents from `.specify/specs/issue-305-deprecate-score-entry/`  
**Prerequisites**: spec.md, plan.md。**D1–D7 / R1–R6 の設計承認が実装開始条件**  
**Tests**: score-entry E2E は削除。残存 E2E の最小修正 + `npm run build`  
**Related Issue**: #305

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列可
- **[Story]**: US1…US4

---

## Phase 1: Setup

- [x] T001 設計承認（D1–D7, R1–R6）を `spec.md` / `plan.md` に反映し Status を Approved にする
- [x] T002 `npm run worklog:start` で Issue #305 実装開始を起票する

---

## Phase 2: Foundational

なし（スキーマ変更なし）。Phase 3 へ直行可。

---

## Phase 3: User Story 1 - ログイン後は対局履歴 (P1) 🎯 MVP

**Goal**: 全ロールのログイン成功先を `/matches` にする。

- [x] T003 [US1] `app/login/actions.ts` の成功時 redirect を常に `/matches` にする
- [x] T004 [US1] `match-import.spec.ts` / `filter-state-e2e.spec.ts` など、ログイン後待ちが `/` 前提の **残す** E2E だけを `/matches` 中心に最小修正する（スコア入力フローの再保証はしない）

**Checkpoint**: ログイン後に対局履歴へ着く。

---

## Phase 4: User Story 2 - 非推奨・非保証バナー (P1)

**Goal**: `/` に非推奨・非保証・import 導線を出す。専用 E2E は追加しない。

- [x] T005 [US2] `components/score-form.tsx`（または `app/page.tsx`）にバナー（非推奨・積極メンテしない・動作保証しない・推奨フロー）と `/matches/import` リンクを追加する
- [x] T006 [P] [US2] バナーが「削除済み」と誤解されない文言であることを確認する（手入力 UI は残置）

**Checkpoint**: 手動で `/` を開きバナーを確認（専用自動テストなし）。

---

## Phase 5: User Story 4 - 専用テスト削除とエージェント規約 (P1)

**Goal**: 非保証をテスト構成と常時ルールに落とす。

- [x] T007 [US4] `test/e2e/ui/score-entry.spec.ts` を削除する
- [x] T008 [P] [US4] README / 設計メモ等で score-entry E2E を必須としている記述を消し、非保証に合わせて直す
- [x] T009 [US4] `.cursor/rules/project-core.mdc` に D4–D7（非保証・専用テスト禁止・必要時のみ改修・#304 原則対象外）を追記する
- [x] T010 [P] [US4] `AGENTS.md` に同趣旨の短い節を追記する
- [x] T011 [P] [US4] `docs/agent-delegation-guide.md` および（推奨）`.github/agent-instructions.md` に `project-core` / `AGENTS.md` への相互参照を 1〜2 行追加する

**Checkpoint**: score-entry スペックが無い。エージェント向け文書に方針がある。

---

## Phase 6: User Story 3 - 文言・ドキュメント整合 (P2)

- [x] T012 [P] [US3] `app/matches/page.tsx` の空状態を一括取り込み優先に更新する
- [x] T013 [P] [US3] `docs/user-manual.md`（必要なら `docs/manual.md`）に非推奨・非保証・推奨フローを追記する
- [x] T014 [P] [US3] `.github/specs/app-spec.md` の `/` を deprecate・非保証注記付きに更新する

**Checkpoint**: 第一推奨が一括取り込みで一貫。

---

## Phase 7: Polish

- [x] T015 `npm run build` 成功を確認する
- [ ] T016 （可能なら）残存 Playwright が score-entry 欠落で失敗しないことを確認する — 未実行（local フル UI E2E 環境未起動）。スペック削除とログイン待ち修正済み
- [x] T017 Spec Status と tasks チェックを実装結果に合わせて更新する

---

## Dependencies & Execution Order

- Phase 1 → US1 → US2 → US4（テスト削除・規約）→ US3 → Polish
- T007（削除）は T004 より後が安全（残す E2E の修正と分離）
- T009–T011 / T012–T014 は [P] 可

## Implementation Strategy

1. MVP: redirect + バナー + score-entry 削除 + agent 規約  
2. 空状態・user docs  
3. build / 残存 e2e →（依頼時）`/pr`

## Notes

- スコア入力 UI の新規テスト追加は禁止
- `saveScoreAction` 削除禁止
- #261 / #268 / #304 を混ぜない（#304 はスコア入力を原則対象外と規約に書く）
