# Issue #189 Spec

## Goal

`MODULE_TYPELESS_PACKAGE_JSON` warnings を恒久的に解消し、`npm run test:*` が package-level ESM を明示しても既存テストを発見・実行できる状態にする。

## Scope

- `package.json` に runtime module semantics を明示する
- `lib/filter-state-preference.js` を ESM export へ揃える
- CommonJS のまま維持するテストは `.cjs` へ分離する
- test discovery と `ts-node` 登録を更新し、CJS テストから TypeScript を読めるようにする

## Out of Scope

- 全テストの ESM 完全移行
- `lib/*.ts` の import 拡張子統一リファクタ
- CI warning suppression のみで済ませる暫定対応
