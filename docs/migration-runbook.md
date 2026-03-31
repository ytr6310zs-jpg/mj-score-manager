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
- ロールバック手順: まずステージングで `npm run migrate:down` を検証。重大な場合は手動 SQL による復旧手順を準備する。

運用チェックリスト
- ランナーが GitHub に正常に接続していること（Actions → Runners）
- `debug-connectivity.yml` をセルフホストで実行して DB へ TCP 接続ができること
- 定期的に OS パッチと runner のアップデートを適用する

連絡先
- ランナー運用担当: TODO（チーム内担当者を記載してください）
