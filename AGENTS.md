# Agent Guide — mj-score-manager

Cursor Agent 向けの入口ドキュメントです。

## Quick Links

| 用途 | ファイル |
|---|---|
| プロジェクト概要・セットアップ | [README.md](README.md) |
| 機能仕様 | [.github/specs/app-spec.md](.github/specs/app-spec.md) |
| 開発規約（常時適用） | [.cursor/rules/project-core.mdc](.cursor/rules/project-core.mdc) |
| 運用ルール詳細（CI 必須） | [.github/agent-instructions.md](.github/agent-instructions.md) |
| Constitution（最上位規約） | [.specify/memory/constitution.md](.specify/memory/constitution.md) |
| 委任テンプレート | [docs/agent-delegation-guide.md](docs/agent-delegation-guide.md) |
| Issue 依頼テンプレート | [docs/issue-prompt-guidelines.md](docs/issue-prompt-guidelines.md) |

## Cursor 設定

```
.cursor/
  rules/          # パス別コーディング規約（.mdc）← 正本
  skills/         # ワークフロースキル（runbook, spec-kit）
  commands/       # スラッシュコマンド（/clarify /design /implement /pr /release）
  mcp.json        # MCP サーバー定義（mcpServers）
```

### Rules（正本）

- **常時適用**: `project-core.mdc` — プロジェクト文脈、Git 方針、品質ゲート
- **パス別**: `typescript`, `react`, `server-actions`, `api-route`, `supabase`, `sql-migration`, `local-supabase-safety`, `mcp-config`

コーディング規約を変更する場合は **`.cursor/rules/` のみ** を更新する。

### Skills

- `issue-implementation-runbook` — 設計承認後の実装フェーズ手順
- `spec-kit-workflow` — Spec Kit フロー（specify → plan → tasks → implement）

### Commands

Agent 入力で `/` から呼び出せます（詳細は `.cursor/commands/`）。

| コマンド | 用途 |
|---|---|
| `/clarify` | Issue 内容の確認・不明点の洗い出し（実装しない） |
| `/design` | Spec 3点作成・自己レビュー・停止（実装禁止） |
| `/implement` | 設計承認後の実装・検証（commit/push/PR は明示依頼時のみ） |
| `/pr` | 実装後の commit → push → PR 作成（この呼び出しが明示依頼） |
| `/release` | develop → main のリリース PR 作成・マージ |

### MCP

`.cursor/mcp.json` に GitHub / Playwright / Supabase Postgres を定義。

- **形式**: ルートキーは `mcpServers`（`servers` だと Settings が空になる）
- **GitHub**: `scripts/mcp-github.sh`（`.env.local` の `GITHUB_TOKEN`、CRLF 耐性）
- **Postgres**: `scripts/mcp-postgres.sh`（`.env.local` の `DATABASE_URL` を argv へ）
- **Playwright**: `@playwright/mcp`

### Git 方針

| 操作 | 方針 |
|---|---|
| commit | ユーザー明示依頼時のみ（`/pr` 可） |
| push | ユーザー明示依頼時のみ（`/pr` 可） |
| PR 作成 | ユーザー明示依頼時のみ（`/pr` 可） |
| マージ / リリース | ユーザー明示依頼時のみ（`/release` = develop→main） |

設計フェーズ完了時の停止、品質ゲート（`npm run build`）、Spec 3点セット、worklog 運用は必須。

## Spec Kit / 手順書

- `.specify/` — Spec 成果物・テンプレート（継続利用）
- `.github/agents/*.agent.md` — Spec Kit フェーズ手順書（Cursor スキルから参照）
- `.github/instructions/` — **deprecated**（旧 Copilot パス別規約。正本は `.cursor/rules/`）
- `.github/prompts/` — **deprecated**（旧 Copilot Chat プロンプト）

## 関連 Issue

- #279 `.cursorignore` と `/commands`
- #280 hooks による機密・worklog ガード
