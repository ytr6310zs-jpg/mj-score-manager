---
applyTo: "{app/**/*-actions.ts,app/api/**/route.ts,lib/**/*.ts,scripts/**/*.mjs,test/e2e/ui/**/*.ts}"
description: "Use when editing server-side code that touches DB/auth/env. Enforce local Supabase safety and prevent remote URL/key usage in local workflows."
---

# Local Supabase Safety Guardrails

この指示は local 開発時の接続先事故を防ぐためのガードです。
既存ドキュメントを優先参照し、重複説明はしないこと。

参照先:
- `README.md`（local Supabase 手順と禁止事項）
- `docs/migration-runbook.md`（移行運用）
- `ddl/README.md`（`ddl/` は read-only）

## MUST

- local 開発向け変更では、staging/production の URL・キーを `.env.local` に書き込む提案をしない。
- `SUPABASE_URL` / `DATABASE_URL` が remote を指す可能性がある変更は、明示的にリスクを説明する。
- DB スキーマ変更は `supabase/migrations/` に追加する。`ddl/` を適用ソースとして扱わない。
- 接続前に env の存在チェックを行い、未設定時は安全に失敗させる。
- PR/説明には、最低1つの実施コマンド結果を含める（最低基準は `npm run build`）。

## SHOULD

- local DB 前提の変更では `npm run check:local-db` または `npm run check:local-db:strict` を検討する。
- UI/E2E 変更では `npm run test:ui:preflight` の必要性を評価し、未実施なら理由を残す。
- env 差分に触れる場合は、機密情報をマスクした記述のみを残す。

## Avoid

- `.env.local` の値を具体値つきでコミット用差分として提案する。
- 「`ddl/` を更新すれば反映される」という案内。
- local 検証を飛ばして remote 環境前提で動作確認を書くこと。
