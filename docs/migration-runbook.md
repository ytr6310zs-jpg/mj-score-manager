# Migration runbook (セルフホスト runner 用)

目的: GitHub-hosted runner からの TCP 制限を回避するため、セルフホスト runner でマイグレーションを実行する手順と運用手順をまとめる。

セットアップ（運用担当）
- VM を用意（Ubuntu 推奨）。内部ネットワークまたは DB に到達できることを確認。
- 必要パッケージ: node, npm, postgresql-client
- レジストレーショントークンを GitHub で発行（Settings → Actions → Runners → New self-hosted runner）
- VM に `scripts/bootstrap-runner.sh` を配置し、以下で実行:

```bash
sudo ./scripts/bootstrap-runner.sh https://github.com/<org>/<repo> <REGISTRATION_TOKEN>
```

セキュリティ
- ランナーは最小権限のネットワーク内に配置し、アクセスは限定する。
- シークレット（`DATABASE_URL` 等）は GitHub Secrets に保存し、ランナーのアクセスは運用者に限定する。
- シークレットのローテーション手順を定義すること。

ワークフロー運用
- 既存の `migrate-staging.yml` は `use_self_hosted: 'true'` を渡すと `mj-db-runner` ラベルのセルフホスト上で実行される。
- 手動実行例（workflow_dispatch）: ワークフローの `use_self_hosted` を `true` に設定してトリガー。

検証・ロールバック
- マイグレーション前に自動で `pg_dump` によるバックアップを取得するワークフローが含まれている。
- ロールバック方針: 原則はロールフォワード（追加 migration で修正）を採用する。
- 重大障害時は `pg_dump` バックアップからの復旧手順を優先し、復旧リハーサルを事前に実施する。

運用チェックリスト
- ランナーが GitHub に正常に接続していること（Actions → Runners）
- `debug-connectivity.yml` をセルフホストで実行して DB へ TCP 接続ができること
- 定期的に OS パッチと runner のアップデートを適用する

連絡先
- ランナー運用担当: TODO（チーム内担当者を記載してください）

## Prod: Reset + Seed Players Workflow

新規で `Prod Reset and Seed Players` ワークフロー（`.github/workflows/prod-reset-and-seed-players.yml`）を追加しました。用途は「稼働前に本番 DB を初期化してマイグレーションを適用し、players を投入する」ための手動トリガーです。

使用方法（要注意: 破壊的操作）:

- **トリガー**: GitHub Actions の `Run workflow`（`workflow_dispatch`）で手動実行。
- **確認入力**: `confirmation` 入力欄に **正確に** `RESET AND SEED` を入力しない限り、reset と migrate は実行されません（誤実行防止）。`run_seed_only=true` を渡すと reset/migrate をスキップして seed のみ実行できます。
- **必須 Secrets**: `PROD_DATABASE_URL`, `PROD_APP_URL`, `PROD_SUPABASE_SERVICE_ROLE_KEY`（リポジトリまたは Environment の Secrets に設定してください）。マイグレーション実行に `SUPABASE_ACCESS_TOKEN` が必要な場合があります。
- **バックアップ**: ワークフローは実行前に `pg_dump` によるバックアップを取得し、`migration-backup` というアーティファクト名で保存します。
- **検証**: 実行後に `players` テーブルの件数と、Issue #73 指定リストのプレイヤーが存在することを psql によって検証します。

注意: 本ワークフローは破壊的な操作を行います。実行前に必ずバックアップの取得先と承認者を確認してください。
