---
applyTo: "**/*.{ts,tsx}"
---

# TypeScript コーディング規約

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- `strict` 前提で型エラーを解消する（`ts-ignore` で回避しない）。
- `any` は使わない。`unknown` と型ガードを使う。
- 外部入力（`FormData`、API応答、DB応答）は境界で検証してから内部型へ変換する。
- `null` / `undefined` の可能性がある値は必ずガードする。
- `Promise` を返す関数には明示的な戻り値型を付与する。
- 共有型は `lib/` か同一責務ファイルに集約し、重複定義しない。

## SHOULD

- `as` キャストは最小限にし、型ガードや `satisfies` を優先する。
- Union 型は判別可能プロパティを持たせ、`switch` で網羅的に分岐する。
- 関数は単一責務を保ち、20-40行を目安に分割する。
- ドメイン型（例: `GameType = "3p" | "4p"`）は文字列リテラルUnionで定義する。
- 返却型は一貫した形に統一する（例: `{ result, error }` または `throw`）。
- ヘルパー関数は副作用の有無を名前で明確にする（`parse*`, `validate*`, `build*` など）。
- 共有定数はマジックナンバーを避け、`const` で命名して再利用する。

## 既存規約との関係

- React 固有は [react.instructions.md](.github/instructions/react.instructions.md) を優先する。
- Server Action 固有は [server-actions.instructions.md](.github/instructions/server-actions.instructions.md) を優先する。
- Supabase / DB アクセス固有は [supabase.instructions.md](.github/instructions/supabase.instructions.md) を優先する。
