# Migration Runbook

目的
- 本番マイグレーションを安全に実行・復旧するための手順と連絡先テンプレを提供する。

事前確認 (Before)
- ステージングで同一マイグレーションが通っていること
- 最新のフルバックアップが存在すること（S3/バックアップ領域）
- 監視・オンコールの連絡先を用意すること

バックアップ手順
- RDS 等マネージド DB:
  - AWS RDS: `aws rds create-db-snapshot --db-instance-identifier <id> --db-snapshot-identifier snapshot-$(date +%Y%m%d%H%M)`
  - GCP Cloud SQL: `gcloud sql backups create --instance=<instance>`
- 自前 Postgres:
  - `PGPASSWORD=$DB_PASS pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -Fc $DB_NAME > prod-backup-$(date +%s).dump`

マイグレーション実行手順
1. 通知: Slack とオンコールに「マイグレーション開始」を通知する。
2. バックアップ取得（上記）を確認。
3. マイグレーション実行:
   - `export DATABASE_URL="<prod url from secret>"`
   - `npm ci`
   - `npm run migrate:up`
4. 検証:
   - `curl -fsS <APP_URL>/health`
   - 主要クエリを手動で実行して応答を確認する。

問題発生時の初動
- 1) 重大な障害（サービス停止・致命的データ欠損）の場合、即時ロールバック/リカバリ手順を開始。
- 2) ロールバック（非破壊的変更）:
  - `npm run migrate:down`（down が安全であることを事前確認している場合のみ）
- 3) バックアップからの復元（最終手段）:
  - `pg_restore -h $HOST -p $PORT -U $USER -d $DB -c prod-backup.dump`
  - 注意: 復元はダウンタイムを伴う可能性が高い。

連絡テンプレ
- タイトル: [URGENT] Production migration failure - <migration-name>
- 内容:
  - 何をしたか: `<migration-name>` を適用中にエラー発生
  - 時刻:
  - 影響範囲:
  - 現在の状況:
  - 次のアクション（担当者）:

復旧報告
- 復旧が完了したら日時、原因、対応、今後の対策を記載して共有する。

付録: 事前に確認すべき簡易テストリスト
- 主要 API の GET/POST が期待通りに応答するか
- DB の行数が急減していないか
- エラー率が上昇していないか
