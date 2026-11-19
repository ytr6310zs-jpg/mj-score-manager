# Feature Specification: スコア入力画面の非推奨化と初期遷移変更

**Feature Branch**: `cursor/issue-305-deprecate-score-entry-bdc1`  
**Created**: 2026-11-19  
**Status**: Approved — 実装中  
**Related Issue**: [#305](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/305)  
**Input**: 運用はスプレッドシート記入 → 一括取り込みが主。スコア入力画面は deprecate。ログイン直後は対局履歴へ。**動作保証・積極メンテはしない。専用 E2E は捨て、どうしても必要なときだけ改修する**（エージェント向け指示を常時ルールへ）。

---

## 背景・目的

現行の新規登録導線は次の2系統がある。

1. **`/` スコア入力**（`ScoreForm` + `saveScoreAction`）— 1対局ずつの Web 手入力
2. **`/matches/import` 一括取り込み** — スプレッドシート等からの一括登録（内部で `saveScoreAction` を再利用）

運用実態（Issue 本文）:

- 開催日に多数対局を素早く記録したい
- 全メンバーがアプリ入力できるわけではない
- スプレッドシートに書き、休憩時などに取り込み・途中経過確認することが多い
- 対局編集は修正用途であり残す

メンテ観点では手入力 UI と取り込み・編集の二重メンテが続く。Issue コメントで **削除ではなく deprecate**、**画面内に記載**、**ログイン直後を対局履歴へ** が示されている。

追加方針（本設計の確定候補）:

- 利用者向けにもエージェント向けにも「積極メンテしない」を明示する
- **動作保証をしない**前提なら、壊れた専用テストを直し続けるのは工数の無駄 → **スコア入力専用の保証テストは削除する**
- 画面コードは残置するが、改修は **どうしても必要な場合のみ**（下記ゲート）

憲法 I（Domain-First）: 共有ドメイン検証（`lib/validate-match` 等）と取り込み経路は引き続き品質対象。スコア入力 **UI** だけを保証対象外にする。

---

## 確定方針

### Issue コメントより

| ID | 決定 |
|----|------|
| D1 | **deprecate**（ルート・登録 API・フォームは残す。削除しない） |
| D2 | スコア入力画面内に非推奨の旨を表示する |
| D3 | ログイン成功後の遷移先を **`/matches`（対局履歴）** に統一する |

### メンテ／テスト／エージェント方針（本改訂で固定）

| ID | 決定 | 含意 |
|----|------|------|
| D4 | スコア入力 **UI の動作保証はしない** | CI で `/` 手入力フローを守らない |
| D5 | スコア入力 **専用** の自動テスト（例: `test/e2e/ui/score-entry.spec.ts`）は **削除**する | 壊れても直さない／直す代わりに捨てる |
| D6 | エージェントはスコア入力 UI を **積極的に改修・改善提案しない** | #304 等でも原則対象外 |
| D7 | 改修してよいのは **どうしても必要な場合のみ**（ゲート下記） | 例外は明示理由を PR に書く |

**改修してよいゲート（いずれか必須）**:

1. ユーザーがスコア入力 UI の改修を **明示依頼**した
2. **共有経路**の修正が必要（例: `saveScoreAction` / `lib/validate-match` が取り込み・編集と共有で、仕様変更のため触る）。このとき UI 側は最小追従に留め、UI 専用の新規テストは追加しない
3. **セキュリティ／データ破壊**など放置できない欠陥がスコア入力 UI 固有で見つかった

**やってはいけないこと**:

- スコア入力 UI の見た目・UX 改善を自主提案する
- 専用 E2E／UI テストを復活・追加して「また保証する」状態に戻す
- 壊れたい専用テストを直して CI 緑を保つ（削除が正）
- 「ついでに score-form も」と別 Issue へ巻き込む

### 設計推奨（承認時に固定）

| ID | 推奨 | 含意 |
|----|------|------|
| R1 | ヘッダー「スコア入力」リンクは **残す**。ラベルに「（非推奨）」は付けない。説明は画面内バナーに集約 | 到達手段は残す |
| R2 | バナーは推奨フロー（スプレッドシート → 一括取り込み）と「積極メンテしない／動作保証しない」旨を含み、`/matches/import` へリンクする | 利用者にも方針が伝わる |
| R3 | `/matches` 空状態を **一括取り込み優先**の案内に更新する | 推奨導線と矛盾しない |
| R4 | `saveScoreAction` と取り込み経由の保存は維持。**専用 E2E は削除**（D5） | 残置 ≠ 保証 |
| R5 | ユーザーマニュアルに非推奨・非保証・推奨フローを追記する | ドキュメント整合 |
| R6 | **エージェント向け**に `AGENTS.md` と `.cursor/rules/project-core.mdc`（必要なら `docs/agent-delegation-guide.md` / `.github/agent-instructions.md` の短い相互参照）へ D4–D7 を書く | エージェントが常時読む場所に置く |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - ログイン後は対局履歴から始める (Priority: P1)

editor / admin / viewer いずれでも、ログイン直後は対局履歴一覧を見たい。

**Why this priority**: Issue コメントの明示要求。

**Independent Test**: 各ロールでログインし、遷移先が `/matches` であること（手動または **取り込み／履歴系** E2E のログイン待ち。スコア入力専用 E2E は使わない）。

**Acceptance Scenarios**:

1. **Given** editor または admin がログインする, **When** 認証成功する, **Then** `/matches` に遷移する（`/` には遷移しない）
2. **Given** viewer がログインする, **When** 認証成功する, **Then** 従来どおり `/matches` に遷移する
3. **Given** ログイン済み editor, **When** ヘッダー「スコア入力」を開く, **Then** `/` を表示できる（動作の自動保証はしない）

---

### User Story 2 - スコア入力画面で非推奨・非保証を知る (Priority: P1)

手入力画面を開いた利用者が、非推奨であること・推奨が取り込みであること・積極メンテ／動作保証の対象外であることをその場で理解したい。

**Why this priority**: Issue の deprecate + 画面内記載 + 本改訂の非保証方針。

**Independent Test**: `/` を開きバナーを読む（手動で足りる。専用 E2E は追加しない）。

**Acceptance Scenarios**:

1. **Given** editor が `/` を開く, **When** 画面を表示する, **Then** 非推奨・推奨フロー・積極メンテしない／動作保証しない旨が読める
2. **Given** 同上, **When** バナー内の取り込みリンクを辿る, **Then** `/matches/import` に到達する
3. **Given** 同上, **When** 手入力で保存を試みる, **Then** コード上は送信可能のまま残る（自動テストでの成功保証はしない）

---

### User Story 3 - 推奨導線の文言を揃える (Priority: P2)

空状態やマニュアルが手入力を第一推奨と書いていると矛盾するため、取り込み優先に揃える。

**Independent Test**: 空の `/matches` と user-manual 該当節。

**Acceptance Scenarios**:

1. **Given** 対局が 0 件の `/matches`, **When** 空状態を表示する, **Then** 一括取り込みを第一案内とする
2. **Given** ユーザー向けドキュメント, **When** スコア入力節を読む, **Then** 非推奨・非保証・推奨フローが記載されている

---

### User Story 4 - エージェントがメンテ方針を知る (Priority: P1)

エージェントが Issue 実装や #304 洗い出しをするとき、スコア入力 UI を積極改修しない／専用テストを復活させない／必要時のみ触る、を常時ルールから読んで従いたい。

**Why this priority**: 利用者バナーだけではエージェント挙動が変わらない（前回指摘）。

**Independent Test**: `AGENTS.md` と `project-core.mdc` に D4–D7 相当が書かれている。`test/e2e/ui/score-entry.spec.ts` がリポジトリに存在しない。

**Acceptance Scenarios**:

1. **Given** エージェント向けドキュメント, **When** スコア入力の扱いを探す, **Then** 非保証・専用テスト削除・必要時のみ改修が書かれている
2. **Given** 本 Issue 実装後の CI, **When** Playwright を実行する, **Then** 削除した score-entry 専用スペックは走らない
3. **Given** 共有の `lib/validate-match` 等のテスト, **When** CI を実行する, **Then** ドメイン／取り込み品質用のテストは残る（UI 専用だけ捨てる）

---

### Edge Cases

- viewer の `/` 制限（middleware）は変更なし
- `/` ブックマーク利用者はバナーで非推奨・非保証を知る
- `saveScoreAction` は取り込みが使うため削除しない。UI 非保証と API 共有は両立する
- 他 E2E（`match-import` / `filter-state` 等）が「スコア入力」リンクをクリックするだけなら、リンク存在アサーションに依存しないよう **必要最小の修正**に留める（スコア入力フローの再保証はしない）
- 将来の完全削除は別 Issue

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST ログイン成功後、全ロールを `/matches` へリダイレクトする
- **FR-002**: System MUST `/` に非推奨・推奨フロー・積極メンテしない／動作保証しない旨を表示する
- **FR-003**: System MUST 非推奨表示から `/matches/import` へ辿れる導線を提供する
- **FR-004**: System MUST NOT 本 Issue で `/` ルート・`ScoreForm`・`saveScoreAction` を削除する（残置）
- **FR-005**: System MUST editor/admin 向けヘッダーのスコア入力リンクを維持する（viewer 非表示は現行維持）
- **FR-006**: System MUST `/matches` 空状態の第一案内を一括取り込み優先に更新する
- **FR-007**: System MUST ユーザー向けドキュメントに非推奨・非保証・推奨フローを反映する
- **FR-008**: System MUST `.github/specs/app-spec.md` を deprecate・非保証方針に合わせて更新する
- **FR-009**: System MUST スコア入力 UI 専用の自動テストを削除する（少なくとも `test/e2e/ui/score-entry.spec.ts`）
- **FR-010**: プロジェクト MUST エージェント向け常時ルール（`AGENTS.md` と `.cursor/rules/project-core.mdc`）に D4–D7 を記載する
- **FR-011**: Agents MUST NOT スコア入力 UI を積極改修・専用テスト復活・自主的 UX 改善の対象にする（D6–D7）

### Key Entities

- 変更なし。導線・コピー・テスト方針・エージェント規約のみ。

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: editor/admin ログイン後の URL が `/matches` である
- **SC-002**: `/` に非推奨・非保証・import 導線がある
- **SC-003**: `test/e2e/ui/score-entry.spec.ts` が削除されている
- **SC-004**: `AGENTS.md` と `project-core.mdc` にスコア入力 UI の非保証・必要時のみ改修が書かれている
- **SC-005**: `/matches` 空状態と user-manual が取り込み優先を示す
- **SC-006**: `npm run build` が通る。Playwright 全体が score-entry 欠落で失敗しない

---

## Assumptions

- D1–D7 および R1–R6 は承認時に固定する
- 「動作保証しない」＝専用自動テストなし・積極メンテなし。残置コードが今日動くことの永久保証ではない
- 共有ドメイン／取り込みのテストは品質ゲート対象のまま
- #304 ではスコア入力 UI を原則サブ Issue 化しない（明示依頼時のみ）

---

## 非スコープ

- `/`・`score-form`・`saveScoreAction` の削除
- 一括取り込みロジックの変更（共有バグ修正がゲート 2 に該当する場合を除く）
- 対局編集 URL の gameId 化（#261）
- 印刷（#268）
- 認証・ロールマトリクスの変更
- スコア入力 UI の新規 E2E／視覚リグレッション追加

---

## 現行実装メモ（調査結果）

- ホーム: `app/page.tsx` → `ScoreForm`
- ログイン後: `app/login/actions.ts` — viewer → `/matches`、それ以外 → `/`
- ヘッダー: `components/app-header.tsx` — viewer 以外に「スコア入力」
- 取り込み: `match-import-actions.ts` → `saveScoreAction`
- 専用 E2E: `test/e2e/ui/score-entry.spec.ts`（Playwright。CI で `npx playwright test` 実行）
- 空状態: `app/matches/page.tsx` 「スコア入力画面から登録してください」
