# Tasks: リリース後の main → develop 同期自動化

**Input**: `.specify/specs/issue-318-auto-sync-main-develop/`  
**Prerequisites**: spec.md / plan.md。**D1–D4 の設計承認**が実装開始条件  
**Related Issue**: #318

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 Status を Approved に更新（`spec.md` / `plan.md`）
- [x] T002 `npm run worklog:start -- --summary "Issue #318 実装開始" --reason "main→develop sync 自動化" --tags "issue-318,implementation,worklog"`
- [x] T003 人間作業チェックリストを PR 本文に記載: `SYNC_MAIN_TO_DEVELOP_TOKEN` の発行・repo secret 登録（Contents R/W, Pull requests R/W）

---

## Phase 2: User Story 1+2 - Workflow (P1) 🎯 MVP

**Goal**: `main` push で sync PR 経由の自動同期。

- [x] T004 [US1][US2] `.github/workflows/sync-main-into-develop.yml` を追加（`push: main` + `workflow_dispatch`、concurrency 固定）
- [x] T005 [US1] 包含済みなら成功終了するステップを実装する
- [x] T006 [US2] `chore/sync-main-into-develop` を `main` tip に合わせ、base=`develop` の PR を作成または再利用する
- [x] T007 [US1][US2] `gh pr merge --merge` でマージし、事後に `merge-base --is-ancestor` を検証する（失敗で job 失敗）
- [x] T008 [US2] workflow / コメントに「機能 PR は対象外」「承認数 0・必須チェックなし前提」を明記する

**Checkpoint**: secret 設定後 `workflow_dispatch` で noop または同期が通る

---

## Phase 3: User Story 3 - 重複回避と失敗可視性 (P2)

- [x] T009 [US3] 同趣旨の open PR 検索（head / タイトル）で乱立を防ぐ
- [x] T010 [US3] 失敗時メッセージに手動フォールバック（`/release` の sync PR 手順）への参照を出す

---

## Phase 4: User Story 4 - Docs (P2)

- [x] T011 [US4] `.cursor/commands/release.md` の同期節を「自動化待ちポーリング → 失敗時のみ手動 sync PR」に更新する
- [x] T012 [P] [US4] `.cursor/commands/design.md` に「通常は自動化で同期済み。ゲート失敗時のみ sync PR」と一文追記する（冗長ならスキップ可）
- [x] T013 [P] [US4] `AGENTS.md` の `/release` 行が自動化と矛盾しないよう必要なら最小更新する

---

## Phase 5: Verification

- [x] T014 `npm run build` 成功
- [x] T015 secret 設定後の `workflow_dispatch` 結果を PR 本文に記載（未設定ならブロッカーとして明記しマージ前に解消）
- [x] T016 受け入れ条件（Issue #318）を PR でチェックオフ

---

## Dependency Graph

```text
T001 → T002 → T003
T003 → T004 → T005 → T006 → T007 → T008
T007 → T009 / T010
T008 → T011 → T012 / T013
T011..T013 → T014 → T015 → T016
```

## Notes

- commit / push / PR はユーザー明示時のみ
- `GITHUB_TOKEN` のみでのマージ成功を受け入れ条件にしない（PAT 必須）
- 保護ルールの変更 PR は作らない
