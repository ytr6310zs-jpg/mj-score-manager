---
title: 導入ツール 簡易クイックスタート
---

概要
--
- 本プロジェクトで導入した主要ツールの最小限の使い方とチェックリストをまとめたチートシート。

対象ツール
--
- Git / GitHub (`git`, `gh`)
- Spec Kit / `.specify`（リポジトリ内の `spec.md` / `plan.md` / `tasks.md`）
- スクリプト: `scripts/extract-specs.mjs`
- MCP（Playwright 用サーバ、Postgres 用接続）
- npm スクリプト: `npm run build`, `npm run dev`, `npm run test:ui`

前提
--
- Node.js と npm がインストールされていること
- `gh` CLI がセットアップ済み（`gh auth login`）
- ローカル Postgres / Supabase を使う場合は該当サービスが起動していること

よく使うコマンド（抜粋）
--

- ビルド / 開発 / テスト

```
npm run build
npm run dev
npm run test:ui
```

- Git / GitHub（PR, Issue）

```
git checkout -b feature/issue-175-<summary>
git branch -m feature/issue-175-<summary>   # ブランチ名変更
git push -u origin feature/issue-175-<summary>

gh pr create --base develop --head feature/issue-175-<summary> --title "..." --body-file PR_BODY.md
gh issue close 175
gh issue comment 184 --body "コメント内容"
```

- Spec Kit / `.specify`

- 既存ワークフロー: `.specify/specs/<xxx>/spec.md`, `plan.md`, `tasks.md` を編集して SDD を回す。
- リポジトリから自動抽出スクリプトを使う（例）:

```
node scripts/extract-specs.mjs
```

- 変更フロー（推奨）:
  1. `spec.md` を作成/更新
  2. `plan.md` に実装手順を記載
  3. `tasks.md` をタスク分解
  4. 変更をコミットして PR を作成

- MCP（Playwright / DB）

- Playwright MCP サーバ起動（例）:
```
npx -y @microsoft/mcp-server-playwright
```

- Read-only DB 接続を使う場合（環境変数例）:
```
read -s MCP_RO_PW && export MCP_DB_URL="postgresql://mcp_readonly:${MCP_RO_PW}@127.0.0.1:54322/postgres"
# その後、MCP の Postgres サーバ起動コマンドがある場合はそれに従う
```

トラブルシューティング（よくある事象）
--

- `npx -y @microsoft/mcp-server-playwright` が失敗する
  - Node のバージョンを確認（推奨: LTS）
  - ネットワーク制限でパッケージが取れない場合は事前に `npm install` してから実行

- MCP 用 DB 接続でパスワードに URL 禁止文字が含まれる
  - `%` エンコードするか、URL 安全なパスワードに変更してください

- Spec Kit の編集に慣れない
  - まずは既存の `.specify/specs/001-brownfield-profile/spec.md` をコピーして小さな feature 用 `spec.md` を作る練習をしてください

学習ロードマップ（短期）
--
1. このドキュメントを読み、ローカルで `npm run build` を通す
2. `node scripts/extract-specs.mjs` を実行して出力を確認
3. 小さな `spec.md` を作って `plan.md` + `tasks.md` を書き、PR を作る（例: UI のスクロール改善）
4. MCP Playwright を起動して簡単な E2E を走らせる（デモ実行）

サポートすること
--
- 必要なら以下を代行します:
  - あなたの環境でのハンズオン（私がコマンドを実行して示す）
  - 小さな SDD デモ（spec → plan → tasks → 実装 → PR）を 1 件やる
  - CI に組み込むチェック（spec の存在確認ジョブ）を作る

ファイル場所（参照）
--
- `.specify/` — Spec Kit アーティファクト
- `scripts/extract-specs.mjs` — 仕様抽出スクリプト
- `.vscode/mcp.json` — MCP ワークスペース設定

---
更新履歴: 初版（簡易チートシート）
