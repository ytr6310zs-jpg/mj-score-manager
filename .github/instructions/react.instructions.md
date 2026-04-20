---
applyTo: "**/*.tsx"
---

# React / Next.js コーディング規約

## コンポーネント分類

- `app/` 配下はデフォルトで **Server Component**。`"use client"` は最小限の境界にのみ付与する。
- インタラクション（`useState`, `useEffect`, イベントハンドラ, ブラウザ API）が必要な場合のみ `"use client"` を付与する。
- `"use client"` コンポーネントは原則 `components/` に置く。`app/**/page.tsx` から直接利用してよいが、状態管理や副作用は UI コンポーネント側に閉じ込める。

## データ取得

- 初期表示に必要なデータは Server Component で取得し、`lib/` の非同期関数を呼ぶ。
- `useEffect` での fetch はブラウザ依存データ（ローカルストレージ、ユーザー操作後の再取得など）に限定する。
- ページレベルのデータ取得は `app/**/page.tsx` に集約し、props で子コンポーネントへ渡す。
- `export const dynamic = "force-dynamic"` はリアルタイム性が必要なページにのみ付与する。

## フォームと状態管理

- フォーム送信は `useActionState` + Server Action パターンを使う。
- `pending` フラグは `useActionState` の戻り値から取得し、ボタンの `disabled` に使う。
- グローバル状態管理ライブラリは導入しない（Context は最小限）。

## 型

- `as` キャストは使わない。型ガード関数または `satisfies` を使う。
- コンポーネント props は `type Props = { ... }` で定義し、インライン型は避ける。
- `any` は使わない。`unknown` + 型ガードを使う。

## 命名

- コンポーネント: PascalCase。ファイル名はコンポーネント名と一致させる。
- hooks: `use` プレフィックス (例: `useYakumans`)。
- Server Actions: `~Action` サフィックス (例: `saveScoreAction`)。

## UI コンポーネント

- `components/ui/` の共通コンポーネント (`Button`, `Card`, `Input` 等) を優先して使う。
- Tailwind クラスは既存パターンを踏襲する（`mx-auto max-w-screen-2xl space-y-6` 等）。
- 新規 UI 要素を追加する前に `components/ui/` に既存実装がないか確認する。

## Next.js 固有

- ページには `export const metadata` を定義し、タイトルと説明を明示する。
- ルーティングは `next/link` を使い、`<a>` の直接利用は避ける。
- 画像表示は原則 `next/image` を優先する（要件上困難な場合のみ例外）。
