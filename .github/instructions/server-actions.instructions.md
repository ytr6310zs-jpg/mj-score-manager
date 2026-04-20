---
applyTo: "app/**/*-actions.ts"
---

# Server Actions 規約

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- ファイル先頭に `"use server"` を置く。
- `formData.get()` の値は文字列化・trim 後に扱う。
- 数値・日付・ID は変換後に範囲チェックまで行う。
- 不正入力は早期リターンする（例: `{ success: false, message: "..." }`）。
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` の存在を検証してから Supabase クライアントを生成する。
- Supabase 呼び出し結果の `error` を必ず確認する。
- ユーザー向けメッセージに内部エラー詳細（SQLエラー等）を含めない。
- `SUPABASE_SERVICE_ROLE_KEY` はサーバーサイドのみで使用する。

## SHOULD

- `useActionState` と組み合わせる action は `XxxState` を返すパターンで統一する。
- 複雑なバリデーションロジックは `lib/validate-*.ts` に切り出す。
- `try/catch` で例外を補足し、`console.error` でログを残す。
- mutation 後は影響する route のみ `revalidatePath` で再検証する。
- 管理系操作は認証チェックを関数冒頭で行う。
- 認可要件がある action は、実行可能主体を関数冒頭で明示する。
