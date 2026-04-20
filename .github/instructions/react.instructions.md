---
applyTo: "**/*.tsx"
---

# React / Next.js コーディング規約

## コンポーネント分類

- `app/` 配下はデフォルトで **Server Component**。`"use client"` は最小限の境界にのみ付与する。
- インタラクション（`useState`, `useEffect`, イベントハンドラ, ブラウザ API）が必要な場合のみ `"use client"` を付与する。
- `"use client"` コンポーネントは `components/` に置き、ページ (`app/**/page.tsx`) では直接使わない。

## データ取得

- Server Component で直接 `lib/` の非同期関数を呼ぶ。`useEffect` での fetch は使わない。
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
