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
| `--admin` マージ | **`/release` 呼び出し時のみ**（かつ CI 成功後・branch lock 回避用途）。チェック失敗の回避・`/release` 外では禁止 |

設計フェーズ完了時の停止、品質ゲート（`npm run build`）、Spec 3点セット、worklog 運用は必須。

## Spec Kit / 手順書

- `.specify/` — Spec 成果物・テンプレート（継続利用）
- `.github/agents/*.agent.md` — Spec Kit フェーズ手順書（Cursor スキルから参照）
- `.github/instructions/` — **deprecated**（旧 Copilot パス別規約。正本は `.cursor/rules/`）
- `.github/prompts/` — **deprecated**（旧 Copilot Chat プロンプト）

## 関連 Issue

- #279 `.cursorignore` と `/commands`
- #280 hooks による機密・worklog ガード

## Cursor Cloud specific instructions

- Node は `package.json` の `engines` と `.npmrc` の `engine-strict=true` に合わせ、**20.19.0 / npm 10.8.2** を使う。イメージ既定の `/exec-daemon/node` は Node 22 なので、`npm ci` は失敗する。20.19.0 を `/usr/local` に置き、`/usr/local/cargo/bin` へ symlink して PATH の先頭で解決する。
- ローカル DB は Docker 上の Supabase CLI `2.84.2`。Cloud VM では Docker の storage driver を `fuse-overlayfs`、iptables を legacy にする。デーモンは systemd ではなく `sudo dockerd` で起動する。
- `supabase/config.toml` はリポジトリに無い。無いときだけ `npx supabase@2.84.2 init --yes` する。起動は `npx supabase@2.84.2 start --exclude studio,imgproxy,mailpit,logflare,vector,storage-api,edge-runtime --yes`。
- `.env.local` は `npx supabase@2.84.2 status -o env` のローカル値から作る。staging / production の URL やキーは入れない。MFA は空のまま。ログインは migration 済みの `admin` / `ChangeMe_184`。
- 開発サーバは `npm run dev -- --hostname 0.0.0.0 --port 3000`。プレイヤー投入は冪等な `npm run seed:players`。`npm run seeds` は削除済み列を参照して失敗する。
- 起動確認は `npm test`、`npm run lint`、`npm run build`、`npm run check:local-db`。画面確認はログイン後にスコア保存し、`/matches` に反映されること。
