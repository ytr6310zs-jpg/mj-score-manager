---
title: Cursor 向けエージェント設定 — 実装計画
---

概要
--
`.github/instructions/` と `.github/copilot-instructions.md` を Cursor 形式（`.cursor/rules/*.mdc`）へ移植し、スキル・MCP・入口ドキュメントを追加する。Copilot 資産は並行維持する。

ステップ
--
1. `.specify/specs/issue-272-cursor-agent-setup/` に spec/plan/tasks を作成 — CI check-spec 対応
2. `.cursor/rules/` に 9 つの `.mdc` を作成 — `applyTo` を `globs` に変換、`project-core.mdc` は Git 方針を Cursor 向けに調整
3. `.cursor/skills/` に runbook と spec-kit-workflow を作成 — 既存 `.github/agents/` を参照マップ
4. `.cursor/mcp.json` を作成 — `.vscode/mcp.json` をコピー
5. `AGENTS.md` と関連ドキュメントを更新 — 最小限の追記
6. `npm run build` で検証し、PR を `develop` 向けに作成

検証
--
- ビルド: `npm run build`
- Lint: `npm run lint`（可能なら）
- テスト: `npm test`（可能なら）

リスクとロールバック
--
- 二重管理（`.github/instructions` と `.cursor/rules`）によるドリフト → `AGENTS.md` に両方更新を明記
- ロールバック: `.cursor/`、`AGENTS.md`、ドキュメント差分を revert すれば Copilot 運用に影響なし
