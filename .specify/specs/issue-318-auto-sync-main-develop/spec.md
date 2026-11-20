# Feature Specification: リリース後の main → develop 同期自動化

**Feature Branch**: `feature/issue-318-auto-sync-main-develop`  
**Created**: 2026-11-20  
**Status**: Approved — 実装中  
**Related Issue**: [#318](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/318)  
**Input**: `/release` 後の人手 sync PR マージをやめたい。`develop` の PR 必須保護は維持する。

---

## 背景・目的

`develop` → `main` を merge コミットで取り込むと、ツリーが同一でも `main` 先端だけが `develop` に含まれず、`/design` の包含チェックが失敗する（#296 / #306）。現状はリリースのたびに sync PR を人手マージしており、承認すべき差分は通常ない。

本 Issue では GitHub Actions により **sync PR の作成とマージを自動化**し、人間は保護付きの監査ログ（PR）だけを残す。機能 PR の自動マージや保護撤廃はしない。

### 現状の保護（調査）

| ブランチ | PR 必須 | 必要承認数 | 必須ステータスチェック | enforce_admins |
|---|---|---|---|---|
| `develop` | あり（reviews 設定あり） | **0** | **なし** | false |
| `main` | あり | 0 | なし（ruleset は削除/非 FF 禁止中心） | false |

→ sync は「PR を必ず経由」しつつ、承認待ちなしで bot マージ可能、という前提が立つ。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - リリース後に自動で develop が main を含む (Priority: P1)

メンテナとして、`/release` で `develop` → `main` をマージしたあと、手動で sync PR をマージしなくても `origin/develop` が `origin/main` を含むようにしたい。

**Why this priority**: Issue の主目的。`/design` 停止の予防。

**Independent Test**: テスト用に `main` だけが進んだ状態（または staging 相当の手順）から Actions を走らせ、包含チェックが成功することを確認できる。

**Acceptance Scenarios**:

1. **Given** `origin/main` が `origin/develop` の祖先でない, **When** `main` へ push（リリースマージ含む）される, **Then** 同期用 workflow が起動する
2. **Given** 同上, **When** workflow が成功する, **Then** `git merge-base --is-ancestor origin/main origin/develop` が成功する
3. **Given** すでに `develop` が `main` を含む, **When** `main` へ無関係でない push が来る（または再実行）, **Then** workflow は no-op で成功し、無駄な空 PR を量産しない

---

### User Story 2 - develop 保護を維持したまま監査可能な PR 経由で同期する (Priority: P1)

運営者として、エージェントや直接 push を防ぐために `develop` の PR 必須は残したい。同期も PR レコードが残ってほしい。

**Why this priority**: Issue 明示の制約。

**Independent Test**: 同期が PR（base=`develop`）経由であること、保護設定を変更していないことで確認できる。

**Acceptance Scenarios**:

1. **Given** 同期が必要, **When** 自動化が動く, **Then** `develop` への更新は sync PR のマージとして記録される（直接 push のみで `develop` を進めない）
2. **Given** リポジトリ設定, **When** 本機能を導入する, **Then** `develop` の「PR 必須」を外す変更を要求しない
3. **Given** 機能ブランチの PR, **When** 本機能が存在する, **Then** 機能 PR は自動マージされない

---

### User Story 3 - 失敗時に気づき、手動フォールバックできる (Priority: P2)

メンテナ／エージェントとして、同期が失敗したら気づき、現行の手動 sync PR 手順に戻れるようにしたい。

**Why this priority**: 自動化の信頼性を運用で補う。

**Independent Test**: 失敗時の Actions 失敗表示と、`/release`・ドキュメントに手動リカバリがあることで確認できる。

**Acceptance Scenarios**:

1. **Given** トークン不足やマージ失敗, **When** workflow が失敗する, **Then** Actions 上で失敗が可視である
2. **Given** 自動化が未完了／失敗, **When** `/release` または `/design` を実行する, **Then** 手動 sync PR（既存手順）で回復できる案内がある
3. **Given** 同趣旨の open sync PR が既にある, **When** 自動化が走る, **Then** 重複 PR を乱立させず既存を更新または再利用する

---

### User Story 4 - /release が人手 sync マージを前提にしない (Priority: P2)

エージェントとして、`/release` 完了条件は「包含が取れたこと」であり、人間に sync PR マージを依頼しないでよいようにしたい。

**Why this priority**: 運用の手間削減が Issue の動機。

**Independent Test**: `/release` 文書が「自動化待ち／検証」中心で、人手マージが必須でないと読めることで確認できる。

**Acceptance Scenarios**:

1. **Given** 自動化が有効, **When** `/release` を読む, **Then** デフォルト手順が「main マージ後に包含を確認（自動化を待つ）」である
2. **Given** 自動化がタイムアウト, **When** `/release` を続ける, **Then** 手動 sync PR フォールバックが残っている

---

### Edge Cases

- `main` への直接的な非リリース push（将来）でも同期が走ってよい（包含を保つ）
- 並行して複数の `main` push → concurrency で直列化
- sync ブランチ名の衝突（エージェントが同名ブランチを使用中）→ 固定名 `chore/sync-main-into-develop` を自動化が所有し、force-with-lease 相当で main tip に合わせる方針を plan で固定
- `required_approving_review_count` が将来 1 以上になった場合 → 本設計の「即マージ」が壊れる。文書に前提を明記し、壊れたら Issue 化
- Actions の `GITHUB_TOKEN` では protected branch への PR マージや後続 workflow 起動が制限されることがある → **専用トークンを正**とする

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST run an automated sync when `main` is updated and `origin/main` is not an ancestor of `origin/develop`
- **FR-002**: System MUST bring `develop` up to date such that `git merge-base --is-ancestor origin/main origin/develop` succeeds without a human merging the sync PR
- **FR-003**: System MUST apply the sync via a pull request into `develop`（PR 必須保護と両立）
- **FR-004**: System MUST NOT remove or weaken `develop` branch protection as part of this change
- **FR-005**: System MUST NOT auto-merge feature PRs into `develop`
- **FR-006**: System MUST avoid creating duplicate open sync PRs for the same purpose
- **FR-007**: System MUST no-op successfully when already synchronized
- **FR-008**: Documentation（少なくとも `.cursor/commands/release.md`）MUST describe wait/verify + manual fallback instead of requiring human sync merge by default
- **FR-009**: System MUST use a documented credential model（専用 PAT / GitHub App 等）that can open and merge PRs into protected `develop`
- **FR-010**: `/design` の手動 sync リカバリ手順は残してよいが、通常経路は自動化前提に更新する

### Key Entities

- **SyncWorkflow**: `main` push で起動する GitHub Actions workflow
- **SyncPullRequest**: base=`develop`、main tip を取り込む同期専用 PR
- **SyncToken**: Actions が PR 作成・マージに使う secret（`GITHUB_TOKEN` 以外を原則とする）

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: リリース後、人手の sync マージなしで包含チェックが成功する（Actions 成功後）
- **SC-002**: 同期のたびに `develop` 向け PR が GitHub 上に残る（監査可能）
- **SC-003**: 既に同期済みのとき workflow が失敗せず、無意味な PR が増えない
- **SC-004**: `/release` を読んだエージェントが「人に sync マージを依頼する」をデフォルトにしない
- **SC-005**: 失敗時に Actions 失敗と手動フォールバックが文書で辿れる

---

## Assumptions

- `develop` の必要承認数は当面 **0**、必須ステータスチェックは **なし**（2026-11-20 調査）。これが変わる場合は設計見直し
- リポジトリ管理者は sync 用 secret を設定できる
- 同期コミットは merge コミットでよい（現行 `/release` の sync と同じ）
- Issue クローズタイミング（#317 / PR #317）は本 Issue の対象外

---

## 非スコープ

- 機能 PR の自動マージ
- `develop` / `main` 保護の撤廃・承認必須化の変更
- リリース PR 自体の自動作成・自動マージ
- Issue クローズ自動化以外の `/release` 大改修
- Fast-forward のみのリリース戦略への移行

---

## Open Decisions

実装前にユーザーが覆さない限り、次を採用する（承認時に確定）。

| ID | 決定（推奨） |
|---|---|
| D1 | トリガは **`push` to `main`**（+ `workflow_dispatch` 手動再実行） |
| D2 | 手段は **sync PR 作成 → 即 `gh pr merge --merge`**（承認 0・必須チェックなし前提） |
| D3 | 認証は repository secret **`SYNC_MAIN_TO_DEVELOP_TOKEN`**（fine-grained PAT または同等）。`GITHUB_TOKEN` 単体は正としない |
| D4 | ブランチ名は **`chore/sync-main-into-develop`** を自動化が更新・再利用 |
