---
applyTo: "lib/**/*.ts"
---

# Supabase / ドメインロジック規約

この規約は `lib/` 配下のうち **DBアクセスを行う関数** に適用する。
`"use client"` を含むクライアント専用ユーティリティには該当しない。

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- DBアクセスは `lib/` に集約する。`app/` や `components/` に直接クエリを書かない。
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` を検証してからクライアントを生成する。
- サービスロールキーはサーバー専用で扱い、クライアントに露出させない。
- Supabase の戻り値は `{ data, error }` で受け、`error` を必ず確認する。
- `game_type` は `'3p'` または `'4p'` のみ許容する。
- 三人打ちデータは `player4` / `score4` / `rank4` などが `null` または空値になり得る前提でガードする。
- スキーマ変更は `supabase/migrations/` に SQL を追加して管理する。

## SHOULD

- クライアント生成時は `createClient(url, key, { auth: { persistSession: false } })` を使う。
- クライアントインスタンスは関数スコープ内で生成する。
- 複数行取得時の `.select()` は必要カラムのみ指定する（`select("*")` は最小限）。
- ページネーションが必要なクエリには `.range()` を使う。
- API/DB 応答境界では型ガードを優先し、`as` キャストは最小限にする。
- 集計・順位計算・スコア補正などの業務ロジックは `lib/` の専用ファイルに切り出す。
- エラー返却は `{ result, error }` 形式または例外 throw のどちらかに統一する。
- `ddl/` は参照用スナップショットとして扱い、適用ソースは `supabase/migrations/` を正とする。
