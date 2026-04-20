---
applyTo: "app/api/**/route.ts"
---

# API Route 規約 (Next.js Route Handlers)

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- Route Handler は `GET` / `POST` など HTTP メソッド関数として実装する。
- 受信値（`searchParams`, `request.json()`, headers）は境界で検証する。
- エラー時は適切な HTTP ステータスを返す（`400` 入力不正、`401/403` 認証・認可、`500` サーバーエラー）。
- 内部エラー詳細（SQL エラー、stack trace、秘密情報）をレスポンスに含めない。
- DBアクセスを行う場合は `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を検証してからクライアント生成する。
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみで利用し、クライアントへ露出させない。
- JSON レスポンスは `NextResponse.json(...)` を使う。

## SHOULD

- 正常系レスポンスの形をエンドポイント単位で安定化させる（キー名を頻繁に変更しない）。
- 入力変換は小さなヘルパー関数に切り出す（`parse*`, `normalize*`）。
- 例外は `try/catch` で補足して `console.error` へ記録する。
- CSV/ファイル応答は `Content-Type` と `Content-Disposition` を明示する。
- 重いクエリ・集計処理は `lib/` に切り出し、Route Handler は I/O 制御に専念させる。
- GET は副作用を持たせない。

## このプロジェクト固有の指針

- `/api/export/*` 系は日付・大会IDフィルタの不正値を無視または `400` で明示し、挙動を統一する。
- `/api/yakumans` は Supabase 未設定時のフォールバックを許容するが、失敗理由はサーバーログに残す。
