# Migrations — 実行手順と Secrets 設定

このドキュメントは CI / runner でマイグレーションを安全に実行するためのまとめです。

local 開発については、staging DB を参照しないことを前提に local Supabase を利用します。

必須 Secrets（リポジトリ／環境に登録）
- `STAGING_DATABASE_URL`, `PROD_DATABASE_URL` — 各環境の Postgres 接続文字列（postgres://user:pass@host:5432/db）
- `DB_CA_BUNDLE_BASE64` —（任意）自前 CA を利用する場合、CA PEM を base64 エンコードして登録
- `SUPABASE_ACCESS_TOKEN` —（必要な場合）supabase CLI の認証に使用

運用上の注意
- リポジトリのマイグレーション適用の正本は `supabase/migrations/` です。
- `ddl/` は参照用スナップショット（read-only）として扱い、`migrations/` はレガシー（deprecated）です。直接 CI の適用ソースにしないでください。
- local 開発では staging / production 用の `DATABASE_URL` や Supabase secrets を使用しないでください。

local 開発の基本方針
- local 開発の標準DBは local Supabase とします。
- local の URL / key は `.env.local` に設定し、staging / production 用の値とは分離します。
- local 検証は local Supabase 上で完結させ、staging は shared 検証環境としてのみ扱います。

ワークフロー
- `.github/workflows/migrate-staging.yml` / `.github/workflows/migrate-prod.yml` は `supabase/migrations/` を用いて `npx supabase db push` を実行し、適用後に `psql` 等で検証する構成になっています。

実行手順（要点）
1. Secrets をリポジトリに設定する（Settings -> Secrets and variables -> Actions）。
2. PR を作成し、`supabase/migrations/` に SQL ファイルを追加して CI を通す。
3. CI はバックアップ（`pg_dump`）→ `npx supabase db push --db-url "$DATABASE_URL"` → 検証 の順で実行します。

ローカル検証コマンド（到達性チェック）
```bash
# Linux/macOS
host=your-db-host
port=5432
nc -vz $host $port
```

```powershell
# Windows PowerShell
$u = [uri]'postgresql://postgres:PASS@db.example.supabase.co:5432/postgres'
$u.Host; $u.Port
Resolve-DnsName $u.Host | Select-Object Name,IPAddress
Test-NetConnection -ComputerName $u.Host -Port $u.Port -InformationLevel Detailed
```

注意点
- GitHub-hosted runner を使う場合、送信元 IP は固定されません。DB 側で IP ホワイトリストがある場合はセルフホスト runner の利用を検討してください。
- カスタム CA を使う場合は `DB_CA_BUNDLE_BASE64` に PEM を base64 で入れ、ワークフローでデコードして `/tmp/db-ca.pem` に保存します。ワークフローでは `NODE_EXTRA_CA_CERTS=/tmp/db-ca.pem` を設定して Node が証明書を検証できるようにします。
- 秘密情報（DB の URL に含まれるパスワードなど）は絶対に公開しないでください。ログに出力されないよう `echo` 等に注意してください。

トラブルシュート（短く）
- 接続タイムアウト: まず `nc` / `Test-NetConnection` で TCP 到達性を確認。runner から接続できない場合はネットワーク/ファイアウォールの問題。
- SSL エラー: ワークフローで `DB_CA_BUNDLE_BASE64` を設定し、`NODE_EXTRA_CA_CERTS` を使って検証ルートを与える。

補足 — Vercel Preview の扱い
- 本リポジトリのワークフローでは、Vercel の preview（プルリクやブランチのプレビュー）を staging 環境として扱います。
- そのため、preview 実行時は `PREVIEW_DATABASE_URL` ではなく `STAGING_DATABASE_URL` を使用してマイグレーションを実行する運用が設定されています。

