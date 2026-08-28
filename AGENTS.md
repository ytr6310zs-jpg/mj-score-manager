# Agent Guide — mj-score-manager

Cursor Agent / Copilot エージェント向けの入口ドキュメントです。

## Quick Links

| 用途 | ファイル |
|---|---|
| プロジェクト概要・セットアップ | [README.md](README.md) |
| 機能仕様 | [.github/specs/app-spec.md](.github/specs/app-spec.md) |
| Cursor 開発規約（常時適用） | [.cursor/rules/project-core.mdc](.cursor/rules/project-core.mdc) |
| Copilot 開発規約（詳細版） | [.github/copilot-instructions.md](.github/copilot-instructions.md) |
| Constitution（最上位規約） | [.specify/memory/constitution.md](.specify/memory/constitution.md) |
| 委任テンプレート | [docs/agent-delegation-guide.md](docs/agent-delegation-guide.md) |
| Issue 依頼テンプレート | [docs/issue-prompt-guidelines.md](docs/issue-prompt-guidelines.md) |

## Cursor 向け設定

```
.cursor/
  rules/          # パス別コーディング規約（.mdc）
  skills/         # ワークフロースキル（runbook, spec-kit）
  mcp.json        # MCP サーバー定義
```

### Rules

- **常時適用**: `project-core.mdc` — プロジェクト文脈、Git 方針、品質ゲート
- **パス別**: `typescript`, `react`, `server-actions`, `api-route`, `supabase`, `sql-migration`, `local-supabase-safety`, `mcp-config`

### Skills

- `issue-implementation-runbook` — 設計承認後の実装フェーズ手順
- `spec-kit-workflow` — Spec Kit フロー（specify → plan → tasks → implement）

### MCP

`.cursor/mcp.json` に GitHub / Playwright / Supabase Postgres（read-only）サーバーを定義。

- **GitHub**: `scripts/mcp-github.sh` が起動時に `.env.local` から `GITHUB_TOKEN` を読み込む（Cursor は `.env.local` を自動読み込みしないため）
- **Supabase Postgres**: 接続 URL はプロンプト入力（read-only 推奨）
- 機密値を `mcp.json` にハードコードしない

## Copilot 向け設定（並行維持）

- `.github/copilot-instructions.md` — CI/husky 必須ファイル
- `.github/instructions/*.instructions.md` — パス別規約（Copilot 用）
- `.github/agents/*.agent.md` — Spec Kit エージェント定義
- `.specify/` — Spec Kit 成果物・テンプレート

## 規約の二重管理について

`.cursor/rules/` と `.github/instructions/` は内容が対応しています。
コーディング規約を変更する場合は **両方を更新** してください。

## Git 方針の違い

| 操作 | Cursor | Copilot |
|---|---|---|
| commit | ユーザー明示依頼時のみ | 自動可 |
| push | ユーザー明示依頼時のみ | 自動可 |
| PR 作成 | ユーザー明示依頼時のみ | 自動可 |

設計フェーズの停止、品質ゲート（`npm run build`）、Spec 3点セット、worklog 運用は両方共通です。
