# Tasks: エージェント規約の正本整理と deprecated 資産の削除

**Input**: Design documents from `.specify/specs/issue-307-agent-docs-canonical/`  
**Prerequisites**: spec.md, plan.md。設計承認後に実装開始  
**Tests**: 参照残存の `rg`、`npm run check:required-files`、`npm run build`  
**Related Issue**: #307

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列可
- **[Story]**: US1…US3（spec の User Story）

---

## Phase 1: Setup

**Purpose**: 実装開始の記録と参照の最終スナップショット

- [x] T001 設計承認済みであることを確認し、Status を Approved に更新する（`spec.md` / `plan.md`）
- [x] T002 `npm run worklog:start -- --summary "Issue #307 実装開始" --reason "deprecated 資産削除と正本階層の明記" --tags "issue-307,implementation,worklog"`
- [x] T003 [P] 実装直前に `rg -n '\.github/(instructions|prompts)' --glob '!node_modules/**' --glob '!.git/**'` を再実行し、掃除対象リストを tasks 実行メモまたは PR 本文に固定する

---

## Phase 2: User Story 1 - deprecated 資産の削除 (P1) 🎯 MVP

**Goal**: 両ディレクトリをリポジトリから除去する。

**Independent Test**: ディレクトリ非存在 + required-files / build。

- [x] T004 [US1] `.github/instructions/` 配下をすべて削除する
- [x] T005 [US1] `.github/prompts/` 配下をすべて削除する
- [x] T006 [US1] `.specify/integrations/copilot.manifest.json` から `.github/prompts/*` エントリを除去する（`.github/agents/*` は残す）

**Checkpoint**: `test ! -d .github/instructions && test ! -d .github/prompts`

---

## Phase 3: User Story 2 - 参照掃除 (P1)

**Goal**: 現行ドキュメントの死んだ参照と deprecated 残置方針を消す。

**Independent Test**: 入口 docs の `rg` と issue-prompt-guidelines のリンク先。

- [x] T007 [P] [US2] `AGENTS.md` の Spec Kit 節から deprecated 2 行を削除する（階層表は US3）
- [x] T008 [P] [US2] `README.md` の deprecated 注記を、正本は `.cursor/rules/`・運用詳細は `agent-instructions.md` のみの表現に更新する
- [x] T009 [P] [US2] `.cursor/rules/project-core.mdc` の「`.github/instructions/` は deprecated」を「規約変更は `.cursor/rules/` のみ」に置換する
- [x] T010 [P] [US2] `.github/agent-instructions.md` の規約変更節から deprecated 参照用の一文を削除／正本のみに更新する
- [x] T011 [US2] `docs/issue-prompt-guidelines.md` の `pr-body-from-changes.prompt.md` 参照を `.cursor/commands/pr.md` に置換する

**Checkpoint**: 現行入口で `.github/instructions` / `.github/prompts` への推奨参照が残っていない

---

## Phase 4: User Story 3 - 文書階層の明記 (P2)

**Goal**: 正本階層と更新先を入口から一望できるようにする。

**Independent Test**: AGENTS の表と project-core の更新先一文。

- [x] T012 [US3] `AGENTS.md` に Issue 準拠の短い文書階層表（憲法 / 日次運用 / 実行手順 / 人間向けコピペ / CI 必須）を追加する。全文同期しない旨を一文でよい
- [x] T013 [US3] `AGENTS.md` に「パス別規約の更新先は `.cursor/rules/` のみ」を明記する（表または直下の箇条）
- [x] T014 [P] [US3] スキップ: AGENTS の Quick Links と文書階層表で足りるため `docs/agent-delegation-guide.md` は未変更

**Checkpoint**: 新規エージェントが AGENTS だけで更新先を誤らない

---

## Phase 5: Polish & Verification

**Purpose**: 受け入れ条件の最終確認

- [x] T015 `rg -n '\.github/(instructions|prompts)' --glob '!node_modules/**' --glob '!.git/**' --glob '!.specify/specs/issue-27{2,4}-*/**'` で現行参照の残りを確認し、ヒットがあれば修正する（履歴 Spec は除外可）
- [x] T016 `npm run check:required-files` を実行して成功させる
- [x] T017 `npm run build` を実行して成功させる
- [x] T018 （推奨）`npm run lint` を実行し、結果を PR 本文に記載する

---

## Dependency Graph

```text
T001 → T002 → T003
T003 → T004 / T005 → T006
T006 → T007..T011（並列可）→ T012 / T013 → T014?
T012..T014 → T015 → T016 → T017 → T018
```

## Parallel Opportunities

- T004 / T005 は順不同だが同一 PR なら連続削除でよい
- T007–T011 はファイル単位で並列可
- T014 は任意・最小差分優先

## Implementation Strategy

1. 削除と manifest を先に済ませ、リンク切れを露出させる
2. 入口 docs をまとめて直し、最後に階層表を載せる（表を先に書くと削除前の deprecated 行と衝突しやすい）
3. 検証コマンドを PR 本文に結果付きで記載

## Notes

- commit / push / PR はユーザー明示依頼時のみ（`/pr`）
- #308 の文言・フロー変更は混在させない
- Constitution 本文の改定は本 Issue では行わない（矛盾があれば入口を要約に留め、必要なら別 Issue）
