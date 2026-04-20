---
applyTo: "app/**/*-actions.ts"
---

# Server Actions 規約

## 必須ファイル先頭ディレクティブ

```ts
"use server";
```

## 関数シグネチャパターン

`useActionState` と組み合わせる場合:

```ts
export type XxxState = {
  success: boolean;
  message: string;
};

export async function xxxAction(
  _prevState: XxxState,
  formData: FormData
): Promise<XxxState> { ... }
```

## バリデーション

- `formData.get()` の値は必ず `String(...).trim()` してから使う。
- 不正値は早期リターン: `return { success: false, message: "..." }`.
- 複雑なバリデーションロジックは `lib/validate-*.ts` に切り出す。
- 数値・日付・ID は `Number(...)` / `Date` の変換後に範囲チェックまで行う。

## Supabase クライアント初期化

Server Action 内での標準パターン:

```ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  return { success: false, message: "Supabase 連携用の環境変数が不足しています。" };
}

const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
```

## エラーハンドリング

- `try/catch` で Supabase エラーをラップし、`console.error` でログを残す。
- ユーザー向けメッセージに内部エラー詳細（SQL エラー等）を含めない。
- `supabase` の戻り値は必ず `error` フィールドを確認する。

## キャッシュ無効化

- 変更した route に対してのみ `revalidatePath("/route")` を呼ぶ。
- 無関係な route を巻き込まない。
- 作成・更新・削除の mutation 後は、一覧や統計など影響する表示の再検証漏れがないか確認する。

## セキュリティ

- `SUPABASE_SERVICE_ROLE_KEY` は Server Action / サーバーサイドのみで使う。クライアントへ露出させない。
- 管理系操作（プレイヤー追加・削除等）は認証チェックを冒頭で行う。
- 認可要件がある action は「誰が実行可能か」を関数冒頭で明示する。
