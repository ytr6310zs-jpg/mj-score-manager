---
title: Cursor 向けエージェント設定の追加
owner: @ytr6310zs-jpg
created: 2026-08-28
---

背景
--
本リポジトリは GitHub Copilot + Spec Kit で運用されており、`.github/copilot-instructions.md` と `.github/instructions/` にエージェント向け規約が集約されている。Cursor Agent はこれらを自動読み込みしないため、同等の文脈を `.cursor/` 配下に並行追加する必要がある。

目的
--
Copilot/Spec Kit 資産を維持しつつ、Cursor Agent がプロジェクト規約・Spec Kit フロー・MCP 設定を参照できるようにする。

受け入れ条件
--
- `.cursor/rules/` に常時適用ルールとパス別規約（9 ファイル）が存在する
- `.cursor/skills/` に実装 runbook と Spec Kit ワークフロースキルが存在する
- `.cursor/mcp.json` が `.vscode/mcp.json` と同等の MCP サーバー定義を持つ
- `AGENTS.md` が Cursor 向け入口として機能する
- Cursor ルールでは commit/push/PR はユーザー明示依頼時のみとする
- `.github/copilot-instructions.md` は維持され CI/husky チェックが通る
- `npm run build` が成功する

影響範囲
--
- `.cursor/`（新規）
- `AGENTS.md`（新規）
- `.specify/specs/issue-272-cursor-agent-setup/`（新規）
- `docs/agent-delegation-guide.md`（Cursor 節追加）
- `README.md`（Cursor 節追加）
- `.github/copilot-instructions.md`（先頭に Cursor 参照を追加）
- `.github/instructions/mcp.instructions.md`（applyTo 更新）

制約
--
- `.specify/init-options.json` の Copilot 統合設定は変更しない
- アプリコード・DB マイグレーションは変更しない
- Copilot 用必須ファイルは削除・移動しない

テスト
--
- ユニット: 対象外（ドキュメント・設定のみ）
- ビルド: `npm run build`

参考
--
- Issue #272
- `.github/copilot-instructions.md`
- `.specify/memory/constitution.md`
