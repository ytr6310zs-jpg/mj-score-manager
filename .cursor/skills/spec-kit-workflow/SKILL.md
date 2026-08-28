---
name: spec-kit-workflow
description: "Use when starting a new feature or spec-driven change. Guides the Spec Kit flow (specify → plan → tasks → implement) using existing agent definitions."
---

# Spec Kit Workflow

Spec Kit ベースの設計・実装フローを Cursor Agent で実行するための手順です。
Copilot 統合（`.specify/integration.json`）は維持し、Cursor では手動で同等フローを実行します。

## Prerequisites

- Constitution: `.specify/memory/constitution.md`
- Templates: `.specify/templates/`
- Feature specs output: `.specify/specs/<feature>/`

## Phase Map

| フェーズ | 読むファイル | 成果物 |
|---|---|---|
| Constitution | `.specify/memory/constitution.md` | 原則の確認 |
| Specify | `.github/agents/speckit.specify.agent.md` | `spec.md` |
| Clarify (任意) | `.github/agents/speckit.clarify.agent.md` | `spec.md` 更新 |
| Plan | `.github/agents/speckit.plan.agent.md` | `plan.md` |
| Tasks | `.github/agents/speckit.tasks.agent.md` | `tasks.md` |
| Implement | `.github/agents/speckit.implement.agent.md` | コード変更 |

## Workflow

1. Issue の概要を読み、`.specify/specs/<feature>/` ディレクトリを作成する。
2. `speckit.specify.agent.md` の手順に従い `spec.md` を作成する。
3. 必要なら `speckit.clarify.agent.md` で要件を明確化する。
4. `speckit.plan.agent.md` に従い `plan.md` を作成する。
5. `speckit.tasks.agent.md` に従い `tasks.md` を作成する。
6. **設計フェーズ完了 — ユーザー確認を待つ**（必須停止）。
7. ユーザー承認後、`speckit.implement.agent.md` と `issue-implementation-runbook` スキルに従い実装する。

## Hooks (参考)

Copilot 向けフック定義は `.specify/extensions.yml` を参照。
Cursor では以下を手動で実行する:

- 新機能開始時: 機能ブランチ作成（`feature/issue-<番号>-<要約>`）
- 設計完了時: worklog 起票
- 実装前: `spec.md` / `plan.md` / `tasks.md` の 3 点セット確認

## CI 対応

PR には `.specify/specs/<feature>/` の変更を含めるか、PR 本文に Spec セクションを記載する（`check-spec` ジョブ対応）。
