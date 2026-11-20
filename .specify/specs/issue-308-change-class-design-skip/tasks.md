# Tasks: 変更クラス判定と設計承認スキップ

**Input**: Design documents from `.specify/specs/issue-308-change-class-design-skip/`  
**Prerequisites**: spec.md, plan.md（ユーザー設計承認後に実装開始）  
**Tests**: 文書整合の `rg` 確認 + `npm run build`（アプリテスト追加なし）  
**Related Issue**: #308

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列可
- **[Story]**: US1…US4

---

## Phase 1: Setup

**Purpose**: 実装ブランチと worklog

- [x] T001 ブランチ `feature/issue-308-change-class-design-skip` が `origin/develop`（main 包含済み）起点であることを確認する
- [x] T002 `npm run worklog:start` で Issue #308 実装開始を起票する（設計時エントリと別に実装開始を残す）
- [x] T003 `.specify/feature.json` の `feature_directory` を `specs/issue-308-change-class-design-skip` にする

---

## Phase 2: Foundational — マトリクス正本 (US1)

**Purpose**: クラス定義の単一正本。以降のコマンドはここを参照する。

- [x] T004 [US1] `docs/issue-prompt-guidelines.md` に変更クラス A–D 表・承認マトリクス・fail-up・省略ステップ表（何を残し何を条件付き省略するか）を追加する
- [x] T005 [US1] 同ファイルの「基本方針」を、トリアージ合意済み A/B の設計承認スキップ例外と矛盾しないよう更新する（C/D・未合意は必須停止のまま）

**Checkpoint**: ガイドだけで SC-001 / マトリクスが一意に読める。

---

## Phase 3: User Story 2 - `/triage` (P1) 🎯 MVP 中核

**Goal**: Issue 着手時にクラス判定・承認点提示・合意待ちができる。

**Independent Test**: `triage.md` の手順どおりに出力項目が揃う。

- [x] T006 [US2] `.cursor/commands/triage.md` を新規作成する（Issue 読取 → クラス案と根拠 → 必須承認点 → fail-up → ユーザー合意待ち。実装・commit 禁止）
- [x] T007 [P] [US2] `.cursor/commands/clarify.md` に `/triage` との役割分担（clarify=不明点、triage=クラス合意）を短く追記する
- [x] T008 [P] [US2] `AGENTS.md` の Commands 表に `/triage` を追加する

**Checkpoint**: `/triage` が入口から発見でき、clarify と混線しない。

---

## Phase 4: User Story 3 & 4 - コマンド／規約連動 (P1)

**Goal**: A/B 連続実行可、C/D と release は人間承認必須。

**Independent Test**: design/implement/release/project-core/委任ガイドの記述がマトリクスと一致。

- [x] T009 [US3] `.cursor/commands/design.md` を更新する: トリアージ合意済み A/B では設計完了の必須停止を省略可。未合意・C/D は停止。同期ゲート（#296）は維持
- [x] T010 [US3] `.cursor/commands/implement.md` を更新する: 開始前にクラス確認。C/D は設計承認必須。A/B は合意クラス再掲。worklog / build は維持
- [x] T011 [US4] `.cursor/commands/release.md` に「変更クラス不問・常に人間承認。トリアージ合意で代替不可」を明記する（手順の大幅変更はしない）
- [x] T012 [P] [US3] `.cursor/rules/project-core.mdc` の作業フロー／Stop Conditions にクラス例外を短く追記する（マトリクス全文は置かない）
- [x] T013 [P] [US3] `docs/agent-delegation-guide.md` の標準フローに `/triage` を挿入し、停止条件表をクラス連動に更新する。委任テンプレにトリアージ／事前クラス合意例を追加する
- [x] T014 [P] [US4] `.github/agent-instructions.md` に必要なら 1 節で整合（重複全文は避け、ガイド／commands へリンク）

**Checkpoint**: SC-002 / SC-003 / SC-004 を文書上満たす。

---

## Phase 5: Polish & Verification

- [x] T015 `rg` で「必ず停止」「スキップ可」「/release」「fail-up」「/triage」を追い、矛盾・欠落がないことを確認する
- [x] T016 `npm run build` を実行して成功させる
- [x] T017 Spec の Status を Approved / 実装完了に合わせ、tasks チェックを更新する

---

## Dependencies

- T004–T005 → T006–T014（正本が先）
- T006 → T007–T008（コマンド実体が先）
- T009–T014 は正本完成後に並列可（[P] 付き）
- T015–T016 は文書変更後

## Notes

- アプリ・hooks・husky・schema は変更しない
- 実装 PR は develop 向け。`/release` は別判断
