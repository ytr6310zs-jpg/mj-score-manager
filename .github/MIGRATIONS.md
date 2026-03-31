# Migrations — 実行手順と Secrets 設定

このドキュメントは CI / runner でマイグレーションを安全に実行するためのまとめです。

必須 Secrets（リポジトリ／環境に登録）
- `PREVIEW_DATABASE_URL`, `STAGING_DATABASE_URL`, `PROD_DATABASE_URL` — 各環境の Postgres 接続文字列（postgres://user:pass@host:5432/db）
- `DB_CA_BUNDLE_BASE64` —（任意）自前 CA を利用する場合、CA PEM を base64 エンコードして登録
- `SSH_PRIVATE_KEY` —（踏み台を使う場合）踏み台に接続する SSH 秘密鍵
- `BASTION_HOST`, `BASTION_USER` —（踏み台を使う場合）接続先情報
- `SUPABASE_ACCESS_TOKEN` —（supabase CLI を使う場合）必要に応じて登録

ワークフロー
- `.github/workflows/migrate-node-pg-migrate.yml` — 既存の `node-pg-migrate` を使うジョブ。`DB_CA_BUNDLE_BASE64` を使って Node に CA を渡せます。
- `.github/workflows/migrate-supabase-cli.yml` — `supabase` CLI を使うジョブ（必要に応じて利用）

実行手順（要点）
1. Secrets をリポジトリに設定する（Settings -> Secrets and variables -> Actions）。
2. ワークフローを `Run workflow` で手動実行。`target` と `use_self_hosted`、`use_ssh_tunnel` を必要に応じて選択。

ローカル検証コマンド（到達性チェック）
- Linux/macOS:
```bash
host=db.gownwwvdhjerzrcoivhq.supabase.co
port=5432
nc -vz $host $port
```
- Windows PowerShell:
```powershell
$u = [uri]'postgresql://postgres:PASS@db.gownwwvdhjerzrcoivhq.supabase.co:5432/postgres'
$u.Host; $u.Port
Resolve-DnsName $u.Host | Select-Object Name,IPAddress
Test-NetConnection -ComputerName $u.Host -Port $u.Port -InformationLevel Detailed
```

注意点
- GitHub-hosted runner を使う場合、送信元 IP は固定されません。DB 側で IP ホワイトリストがある場合はセルフホスト runner か踏み台経由してください。
- カスタム CA を使う場合は `DB_CA_BUNDLE_BASE64` に PEM を base64 で入れ、ワークフローでデコードして `/tmp/db-ca.pem` に保存します。ワークフローでは `NODE_EXTRA_CA_CERTS=/tmp/db-ca.pem` を設定して Node が証明書を検証できるようにします。
- 秘密情報（DB の URL に含まれるパスワードなど）は絶対に公開しないでください。ログに出力されないよう `echo` 等に注意してください。

トラブルシュート（短く）
- 接続タイムアウト: まず `nc` / `Test-NetConnection` で TCP 到達性を確認。踏み台からは接続できるが runner からはできない → ネットワーク/ファイアウォールの問題。
- SSL エラー: ワークフローで `DB_CA_BUNDLE_BASE64` を設定し、`NODE_EXTRA_CA_CERTS` を使って検証ルートを与える。

必要なら、`systemd` 用の `autossh` ユニットや、Actions の完全雛形（Secrets 登録手順付き）を追加で作成します。
