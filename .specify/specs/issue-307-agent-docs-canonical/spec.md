# Feature Specification: エージェント規約の正本整理と deprecated 資産の削除

**Feature Branch**: `feature/issue-307-agent-docs-canonical`  
**Created**: 2026-11-19  
**Status**: Approved — 実装中  
**Related Issue**: [#307](https://github.com/ytr6310zs-jpg/mj-score-manager/issues/307)  
**Input**: Cursor 正本定着後も `.github/instructions/` / `.github/prompts/` を deprecated 残置したままになっている。削除と正本階層の明文化でドリフトを止める。

---

## 背景・目的

#274 で Copilot パス別規約・プロンプトを削除せず deprecated 明示した。Cursor 正本（`.cursor/rules/`）は定着済みであり、残置は旧指示の拾い上げと二重管理の源になる。将来 Copilot に戻す場合も、その時点の Cursor 正本から作り直す方がよい（履歴は git / Issue / Spec で追える）。

本 Issue では:

1. 文書階層（正本の役割）を入口ドキュメントに短く明記する
2. deprecated ディレクトリを削除し、現行ドキュメントの参照を掃除して規範の更新先を一本化する

関連: #308（変更クラス判定と設計承認スキップ）は別 Issue。本仕様では触れない。

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - deprecated 資産の削除 (Priority: P1)

メンテナとして、旧 Copilot 向けの `.github/instructions/` と `.github/prompts/` をリポジトリから取り除き、エージェントが誤って旧規約を読まないようにしたい。

**Why this priority**: Issue の主目的。残置がドリフト源。

**Independent Test**: 両ディレクトリが存在しないこと、および削除後も `npm run check:required-files` と `npm run build` が通ることで確認できる。

**Acceptance Scenarios**:

1. **Given** develop 先端のツリー, **When** 本変更を適用する, **Then** `.github/instructions/` と `.github/prompts/` が存在しない
2. **Given** 同上, **When** `npm run check:required-files` を実行する, **Then** 成功する（`.github/agent-instructions.md` は残存）
3. **Given** 同上, **When** `npm run build` を実行する, **Then** 成功する

---

### User Story 2 - 参照掃除と代替リンク (Priority: P1)

メンテナ／エージェントとして、入口・運用ドキュメントから「deprecated 残置」表現と死んだパス参照を消し、代わりに現行の正本／コマンドへ誘導したい。

**Why this priority**: 削除だけではリンク切れと方針の矛盾が残る。

**Independent Test**: 現行入口ドキュメントを `rg` で検索し、`.github/instructions` / `.github/prompts` への現行推奨参照が無いこと、および PR 本文手順が `/pr` に向いていることで確認できる。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md` / `README.md` / `.cursor/rules/project-core.mdc` / `.github/agent-instructions.md`, **When** 読む, **Then** 「`.github/instructions/` は deprecated 残置」等の方針が消え、削除済みまたは正本のみと読める
2. **Given** `docs/issue-prompt-guidelines.md`, **When** PR 本文の自動生成を案内する箇所を見る, **Then** `.github/prompts/pr-body-from-changes.prompt.md` ではなく `.cursor/commands/pr.md`（または同等の現行手順）を指す
3. **Given** `.specify/integrations/copilot.manifest.json`, **When** 削除後, **Then** 存在しない `.github/prompts/*` パスを files に含まない（agents エントリは維持可）

---

### User Story 3 - 文書階層の明記 (Priority: P2)

エージェント／人間として、憲法・日次運用・手順・委任テンプレ・CI 必須文書のどれが正本かを入口から一望したい。規約変更時の更新先が `.cursor/rules/` のみであると分かるようにしたい。

**Why this priority**: Issue の「正本の明記」。削除後の迷いを防ぐ。

**Independent Test**: `AGENTS.md` および/または `project-core.mdc` に階層表または同等の短い記述があり、パス別規約の更新先が `.cursor/rules/` のみと書かれていることで確認できる。

**Acceptance Scenarios**:

1. **Given** `AGENTS.md`（および必要なら `project-core.mdc`）, **When** 文書階層を確認する, **Then** Issue 記載の層（憲法 / 日次運用 / 実行手順 / 人間向けコピペ / CI 必須）が短く分かる
2. **Given** 同上, **When** パス別コーディング規約を変えようとする, **Then** 更新先は `.cursor/rules/` のみと明記されている
3. **Given** 階層の記述, **When** 読む, **Then** 全文同期を求めず「正本以外に規範文を増やさない」方針と矛盾しない

---

### Edge Cases

- 履歴 Spec（#274 / #272 等）内の「deprecated 残置」記述は必須更新しない（Issue 明示）
- `.github/agents/` と `.github/agent-instructions.md` は削除しない
- `required-files` / husky は `agent-instructions.md` のみ必須であり、instructions/prompts 削除で壊れないこと
- `.specify/integration.json` の `integration: copilot` ラベルは残ってよい（agents 手順書は継続）。prompts ハッシュだけ掃除
- Constitution の「日次運用ルール」表記と入口の階層表が矛盾しないこと（矛盾時は Constitution を優先し、入口は要約に留める）

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Repository MUST NOT contain `.github/instructions/` directory or its files
- **FR-002**: Repository MUST NOT contain `.github/prompts/` directory or its files
- **FR-003**: Repository MUST retain `.github/agent-instructions.md` and keep `check:required-files` / CI required-files 成功
- **FR-004**: Repository MUST retain `.github/agents/*.agent.md`（Spec Kit 手順書）
- **FR-005**: Entry docs（少なくとも `AGENTS.md`、推奨で `project-core.mdc`）MUST 文書階層を短く記載する
- **FR-006**: Path-specific coding rule updates MUST be documented as `.cursor/rules/` only（第二の正本を作らない）
- **FR-007**: Active docs MUST NOT recommend reading or keeping `.github/instructions/` / `.github/prompts/` as deprecated mirrors
- **FR-008**: `docs/issue-prompt-guidelines.md` MUST point PR-body guidance to a current Cursor path（`.cursor/commands/pr.md`）
- **FR-009**: `.specify/integrations/copilot.manifest.json` MUST NOT list deleted prompt file paths
- **FR-010**: Historical Specs under `.specify/specs/issue-274-*` / `issue-272-*` MUST NOT be required to rewrite for this Issue
- **FR-011**: This change MUST NOT modify application runtime code or DB migrations
- **FR-012**: This change MUST NOT implement #308（変更クラス／設計承認スキップ）

### Key Entities

- **DocumentTier**: 憲法 / 日次運用 / 実行手順 / 人間向けコピペ / CI 必須運用詳細
- **CanonicalPathRules**: `.cursor/rules/*.mdc`（パス別規約の唯一の更新先）
- **DeprecatedCopilotAssets**: 削除対象の `.github/instructions/` と `.github/prompts/`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `test ! -d .github/instructions && test ! -d .github/prompts` が真
- **SC-002**: `rg '\.github/(instructions|prompts)'` が、履歴 Spec・削除前の言及を除く現行入口／運用ドキュメントでヒットしない（許容: 「削除済み」「旧資産」など過去形の一文）
- **SC-003**: `AGENTS.md` に文書階層が記載され、規約更新先が `.cursor/rules/` のみと分かる
- **SC-004**: `npm run check:required-files` と `npm run build` が成功する

---

## Assumptions

- Issue 本文の文書階層案を採用する（全文同期はしない）
- PR 本文生成の代替は既存の `/pr`（`.cursor/commands/pr.md`）で足り、新規プロンプトファイルは作らない
- `copilot.manifest.json` から prompts キーを除去するだけでよく、integration 名のリネームは本 Issue 外
- #308 との連携はコメントどおり「合わせて進める」が、成果物・タスクは分離する

---

## 非スコープ

- `.cursor/rules/` 本体の移動・大幅改稿
- `.github/agents/` の削除・移設
- `.github/agent-instructions.md` の削除・大幅改稿（deprecated 一文の置換はスコープ内）
- #308 の変更クラス判定・設計承認スキップ
- アプリコード・DB・CI workflow の機能変更（required-files は現状維持）
- 履歴 Spec の全面書き換え
- Copilot 再導入用の新規資産生成

---

## 調査メモ（現状）

### 削除対象

- `.github/instructions/`: README + 8 本の `*.instructions.md`（正本は `.cursor/rules/*.mdc` に対応表あり）
- `.github/prompts/`: README + `pr-body-from-changes.prompt.md` + Spec Kit 向け `speckit.*.prompt.md`（多くはスタブ）

### 現行参照（掃除対象）

| ファイル | 内容 |
|---|---|
| `AGENTS.md` | Spec Kit 節で両ディレクトリを deprecated と列挙 |
| `README.md` | `.github/instructions/` は deprecated |
| `.cursor/rules/project-core.mdc` | 規約変更時の deprecated 注記 |
| `.github/agent-instructions.md` | 規約変更節の deprecated 参照用 |
| `docs/issue-prompt-guidelines.md` | `pr-body-from-changes.prompt.md` へのリンク |
| `.specify/integrations/copilot.manifest.json` | `.github/prompts/speckit.*.prompt.md` のハッシュ |

### 必須ファイル

- `package.json` の `check:required-files` と `.github/workflows/required-files.yml` は `.github/agent-instructions.md` のみ検証
