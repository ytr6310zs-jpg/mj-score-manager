# Tasks: E2E ヘッダー／画面遷移契約の安定化

**Input**: `.specify/specs/issue-310-e2e-nav-contract/`  
**Prerequisites**: spec.md, plan.md。**ユーザーによる設計承認が実装開始条件**  
**Related Issue**: #310

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 ブランチ `feature/issue-310-e2e-nav-contract` が `origin/develop`（main 取り込み済み）起点であることを確認する
- [x] T002 `npm run worklog:start` で Issue #310 実装開始を起票する（tags: `issue-310,implementation,worklog`）
- [x] T003 設計 Status を Approved に更新する（`spec.md` / `plan.md`）

---

## Phase 2: User Story 1 - 管理メニュー契約 (P1) 🎯 MVP

**Goal**: admin ハンバーガーの「管理」が Playwright から安定して操作できる。

**Independent Test**: `npx playwright test test/e2e/ui/admin-navigation.spec.ts`（または CI integration）

- [x] T004 [US1] `components/app-header.tsx` の Menu を調査し、`role="menu"` 内の非 menuitem（ユーザー情報 div）を解消する（外へ出すか、disclosure + `link` に変更）
- [x] T005 [US1] admin のみ「管理」表示、viewer では非表示の権限契約を回帰確認する（手動または既存ページ目視）
- [x] T006 [US1] `test/e2e/ui/admin-navigation.spec.ts` のセレクタ／ログイン待ちを新契約と着地 path（`/` または `/matches`）に合わせる
- [ ] T007 [US1] admin-navigation がローカルまたは CI でパスすることを確認する

**Checkpoint**: US1 単独で CI hard fail が解消できる状態

---

## Phase 3: User Story 2 - 遷移 settle (P1)

**Goal**: login 直後および `/matches`・`/matches/import` の `goto` で `ERR_ABORTED` flaky を抑える。

**Independent Test**: `match-import.spec.ts` が同一実行で `ERR_ABORTED` なく完走

- [x] T008 [P] [US2] （任意）`test/e2e/ui/helpers/auth.ts` にログイン + settle ヘルパーを抽出し、`admin-navigation` / `match-import` から利用する
- [x] T009 [US2] `test/e2e/ui/match-import.spec.ts` の `beforeEach` と各 `goto` に settle（見出し待ち等）を入れる
- [x] T010 [US2] develop 着地と #305 想定着地の両方でヘルパーが通ることをコメントまたは分岐で明示する
- [ ] T011 [US2] match-import をローカルまたは CI で確認する

**Checkpoint**: SC-001 / SC-002 を満たす

---

## Phase 4: Polish

- [x] T012 `npm run build` 成功を確認する
- [x] T013 [P] 差分に #305 スコープ（score-form deprecate、login redirect 変更、score-entry 削除、docs）が混入していないことを確認する
- [x] T014 PR 本文に設計概要・検証・Unblocks #305 を記載し develop 向けに作成する（ユーザー明示の `/pr` 時）

---

## Dependencies

- US2 のヘルパー抽出（T008）は US1 のログイン待ち修正（T006）と並列可。UI 修正（T004）が先でも後でもよいが、セレクタ更新（T006）は T004 の後
- #305 / PR #309 の rebase は本 Issue マージ後（実装フェーズ外の引き継ぎ）

## Parallel Opportunities

- T008 と T004 は別ファイルなら並列可
- T012 と T013 は並列可
