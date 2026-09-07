---
title: Copilot 資産の整理と Cursor 専用化
owner: @ytr6310zs-jpg
created: 2026-09-07
---

背景
--
Issue #272 / #276 で Cursor 向け rules / skills / MCP は整備済み。今後 GitHub Copilot によるエージェント型作業は行わず、Cursor Agent を主運用とする。
一方で `.github/copilot-instructions.md` と `.github/instructions/` が残存し、エージェントが旧指示を拾う・規約が二重管理になるリスクがある。

目的
--
`.cursor/` を開発規約の正本とし、ドキュメント・CI・入口を Cursor 専用運用に揃える。Copilot 専用 UI 設定は無効化し、Spec Kit 手順書（`.github/agents/`）は再利用のため維持する。

受け入れ条件
--
- Cursor Agent のみで Issue 実装フロー（設計→実装→PR）が完結できる導線が `AGENTS.md` から辿れる
- 必須ファイルチェック（CI / husky）が新ファイル名で通る
- `npm run build` が成功する
- 規約の正本が `.cursor/rules/` であることが文書上明確である
- アプリコード・DB マイグレーションを変更しない

影響範囲
--
- `AGENTS.md`, `README.md`, `docs/agent-delegation-guide.md`, `docs/issue-prompt-guidelines.md`
- `.github/copilot-instructions.md` → `.github/agent-instructions.md`（リネーム + 冒頭/Git方針の Cursor 整合）
- `.github/workflows/required-files.yml`, `package.json` (`check:required-files`), `.husky/pre-commit`, `.github/PULL_REQUEST_TEMPLATE.md`
- `.specify/memory/constitution.md`, `.specify/init-options.json`（`context_file` 更新）
- `.github/instructions/README.md`（deprecated 明示、新規）
- `.github/prompts/README.md`（deprecated 明示、新規）
- `.vscode/settings.json`（`github.copilot.*` 削除）
- `.github/skills/issue-implementation-runbook/SKILL.md`, `.github/specs/app-spec.md`（参照パス更新）
- `.github/agents/speckit.plan.agent.md`（SPECKIT マーカー参照パス更新）

制約
--
- `.github/agents/` は削除しない（Cursor スキルから参照する手順書）
- `.specify/specs/` の過去成果物は原則書き換えない（現行ドキュメントと CI のみ更新）
- Spec Kit CLI の `integration` 値が `"cursor"` を公式サポートしない場合は `"copilot"` を残し、`context_file` のみ新パスへ更新する
- `.github/instructions/` の実体削除や symlink 化は行わない（ドリフト防止は「正本は `.cursor/rules/`」の明文化で代替）
- Git 方針は Cursor 規約に合わせ、**commit/push/PR はユーザー明示依頼時のみ** を正とする（旧 Copilot 自動許可は削除）

テスト
--
- ユニット: 対象外（ドキュメント・設定のみ）
- ビルド: `npm run build`
- フック: `npm run check:required-files`（新パスで成功）

参考
--
- Issue #274
- Issue #272 / #276（Cursor 設定基盤）
- `.cursor/rules/project-core.mdc`
- `.cursor/skills/spec-kit-workflow/SKILL.md`
