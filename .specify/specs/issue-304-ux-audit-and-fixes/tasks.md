# Tasks: 画面全般の UI/UX 問題検出・修正（親）

**Input**: Design documents from `.specify/specs/issue-304-ux-audit-and-fixes/`  
**Prerequisites**: spec.md, plan.md。**設計承認後に実装開始**（クラス C）  
**Related Issue**: #304  
**Note**: アプリの本格修正はサブ Issue。本 tasks は親ハブ（検出・切り出し・クローズ条件）が主。

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup

- [x] T001 ブランチ `feature/issue-304-ux-audit-and-fixes` が `origin/develop`（main 包含）起点であることを確認する
- [x] T002 `npm run worklog:start -- --summary "Issue #304 実装開始（UX検出・サブ切り出し）" --reason "親Issueの検出カタログとサブ化" --tags "issue-304,implementation,worklog"`
- [x] T003 Open Decisions D1–D3 の承認結果を `spec.md` / `plan.md` に反映し Status を更新する

---

## Phase 2: User Story 1 - 検出カタログ (P1) 🎯 MVP

**Goal**: `ux-findings.md` に初回パス画面×観点の結果を残す。

**Independent Test**: カタログを開き、対象画面が揃い、各 Finding に深刻度と振分がある。

- [x] T004 [US1] `.specify/specs/issue-304-ux-audit-and-fixes/ux-findings.md` をテンプレ付きで作成する（画面 / 観点 / 現象 / 期待 / 深刻度 / 振分 / 状態）
- [x] T005 [US1] `/login`・`/matches`・`/matches/import` をウォークスルーし Finding を追記する
- [x] T006 [P] [US1] 編集画面・`/stats`・印刷系をウォークスルーし Finding を追記する
- [x] T007 [P] [US1] `/admin` 配下をウォークスルーし Finding を追記する（権限ロール差に注意）
- [x] T008 [US1] `/`（deprecate）を致命的観点のみ確認し、非致命は「対象外 #305」と記録する
- [x] T009 [US1] 既存 Issue（#268 / #261 / #31 等）へ振分可能な行をリンクする

**Checkpoint**: SC-001。カタログレビュー可能。

---

## Phase 3: User Story 2 - サブ Issue 切り出し (P1)

**Goal**: 要対応かつ未振分を Issue 化し、P1 一覧を明確にする。

**Independent Test**: Parent: #304 のサブ（または振分先）が GitHub 上で辿れる。

- [x] T010 [US2] カタログの P1「要サブ」について `gh issue create` でサブを作成する（本文に Parent #304・受け入れ・非スコープ）→ #326 / #327
- [x] T011 [US2] P2 も必要なら Issue 化するか、カタログに「後続」と残す方針を記録する（#261/#31/#268 振分、F07 は後続）
- [x] T012 [US2] #304 本文またはコメントにサブ／振分一覧へのポインタを追記する
- [x] T013 [US2] 各 P1 サブ着手時に `/triage` が必要である旨をサブ本文に明記する

**Checkpoint**: SC-002。

---

## Phase 4: User Story 3 - P1 完了追跡と親クローズ (P2)

**Goal**: P1 の完了／見送りをカタログに反映し、親をクローズ可能にする。

**Independent Test**: P1 行がすべて対応済みまたは見送り。残 P2+ は Issue 化済み。

- [ ] T014 [US3] 各 P1 サブの実装は **別ブランチ／別 PR** で進め、マージ後にカタログ状態を更新する
- [ ] T015 [US3] 見送り P1 があれば理由をカタログと Issue に残す
- [ ] T016 [US3] 親クローズ条件（SC-003）を満たしたら #304 をクローズする（本番反映ルールに従う）

---

## Phase 5: Polish

- [x] T017 [P] `AGENTS.md` / `docs/index.md` に UX 実践チェックリストへのリンクを追加
- [x] T018 一般プラクティスチェックリスト作成（`docs/ux-practice-checklist.md`）と再点検（F23–F25 → #338–#340）
- [ ] T018 親ブランチの差分に schema／認証変更が混入していないことを確認する
- [ ] T019 `npm run build`（親でアプリ差分がある場合。ドキュメントのみなら省略理由を PR に記載）

---

## Dependencies

- Phase 2 → Phase 3 → Phase 4
- T014 以降はサブの完了に依存（親会話では追跡とカタログ更新が主）

## 実装メモ

- 極小の文言修正を親 PR に含める場合はクラス再判定（B 相当でも親は C 合意のまま設計承認済みとしてよいが、差分が大きくなったら再トリアージ）
- commit / push / PR はユーザー明示依頼時のみ
