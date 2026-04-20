---
applyTo: "lib/**/*.ts"
---

# Supabase / ドメインロジック規約

## クライアント生成

- `lib/` の関数は `createClient(url, key, { auth: { persistSession: false } })` を使う。
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` は関数呼び出し時に検証し、不足なら早期エラーを返す。
- クライアントインスタンスは関数スコープ内で生成する（モジュールスコープでの保持は避ける）。

## クエリパターン

- 戻り値の `{ data, error }` は必ず分割代入で受け取り、`error` を先に確認する。
- 複数行取得は `.select()` に必要カラムのみ指定する（`select("*")` は最小限に）。
- ページネーションが必要なクエリには `.range()` を付ける。

## 型安全

- Supabase から取得した生データは `unknown` として受け取り、型ガードで絞り込む。
- `as` でのキャストは使わない。

## ドメインロジックの配置ルール

- DB アクセスは `lib/` に集約する。`app/` や `components/` に直接クエリを書かない。
- 集計・順位計算・スコア補正などの業務ロジックは `lib/` の専用ファイルに切り出す。
  - 例: `lib/stats.ts`, `lib/validate-match.ts`, `lib/stats-ranking.js`
- 麻雀ルール（飛び・飛ばし・焼き鳥・役満）の判定は `lib/` に置き、UI から分離する。

## エラー返却パターン

関数は `{ data, error }` 形式か、例外を throw する形式で統一する:

```ts
// 推奨パターン
export async function fetchXxx(): Promise<{ result: Xxx[]; error: string | null }> {
  const { data, error } = await supabase.from("xxx").select("...");
  if (error) return { result: [], error: error.message };
  return { result: data, error: null };
}
```

## マイグレーション

- スキーマ変更は `supabase/migrations/` に SQL ファイルを追加する。
- ファイル名は `YYYYMMDDHHmmss_description.sql` 形式。
- `ddl/` は参照用の手動スナップショット。直接 DB へ適用しない。

## ゲームモード

- `game_type` は `'3p'` または `'4p'` のみ。他の値を許容しない。
- 三人打ちでは `player4` / `score4` / `rank4` 等は `null` になる。これを前提にした null チェックを行う。
