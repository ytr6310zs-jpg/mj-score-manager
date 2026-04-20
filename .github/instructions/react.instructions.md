---
applyTo: "**/*.tsx"
---

# React / Next.js コーディング規約

優先度定義:
- MUST: 原則必須。例外は理由をPRに記載する。
- SHOULD: 原則推奨。要件や既存実装との整合で逸脱可。

## MUST

- `app/` 配下はデフォルトで Server Component とし、`"use client"` は必要最小限の境界にのみ付与する。
- 初期表示に必要なデータは Server Component で取得し、`lib/` の非同期関数を呼ぶ。
- フォーム送信は `useActionState` + Server Action パターンを使う。
- `pending` フラグは `useActionState` の戻り値から取得し、送信ボタンの `disabled` 制御に使う。
- `any` は使わない。`unknown` と型ガードを使う。
- ページには `export const metadata` を定義し、タイトルと説明を明示する。
- ルーティングは `next/link` を使う。

## SHOULD

- `"use client"` コンポーネントは原則 `components/` に置き、状態管理や副作用をUIコンポーネント側に閉じ込める。
- `useEffect` での fetch はブラウザ依存データ（ローカルストレージ、ユーザー操作後の再取得など）に限定する。
- ページレベルのデータ取得は `app/**/page.tsx` に集約し、props で子コンポーネントへ渡す。
- `export const dynamic = "force-dynamic"` はリアルタイム性が必要なページにのみ付与する。
- `as` キャストは最小限にし、型ガード関数または `satisfies` を優先する。
- コンポーネント props は `type Props = { ... }` で定義し、インライン型は避ける。
- コンポーネントは PascalCase、hooks は `use` プレフィックス、Server Action は `Action` サフィックスを使う。
- `components/ui/` の共通コンポーネント (`Button`, `Card`, `Input` 等) を優先して使う。
- Tailwind クラスは既存パターンを踏襲する。
- 画像表示は原則 `next/image` を優先する（要件上困難な場合のみ例外）。
